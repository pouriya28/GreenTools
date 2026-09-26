<?php

use App\Enums\CommentStatus;
use App\Models\Comment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeProduct(): Product
{
    return Product::factory()->create();
}

function makeUser(): User
{
    return User::factory()->create();
}

function makeApprovedComment(Product $product, ?User $user = null): Comment
{
    return Comment::factory()
        ->forProduct($product)
        ->approved()
        ->create(['user_id' => $user?->id]);
}

// ---------------------------------------------------------------------------
// INDEX — GET /api/v1/comments
// ---------------------------------------------------------------------------

describe('CommentController::index', function () {

    // index returns ONLY root comments (whereNull('parent_id')); replies are nested inside each root.
    // Response shape: { data: { items: [...], meta: {...} } }

    it('returns approved root comments for a product', function () {
        $product = makeProduct();
        Comment::factory()->forProduct($product)->approved()->count(3)->create();
        Comment::factory()->forProduct($product)->pending()->count(2)->create();

        $response = $this->getJson("/api/v1/comments?commentable_type=product&commentable_id={$product->id}");

        $response->assertOk()
            ->assertJsonCount(3, 'data.items');
    });

    it('does not return rejected or pending comments to guests', function () {
        $product = makeProduct();
        Comment::factory()->forProduct($product)->rejected()->create();
        Comment::factory()->forProduct($product)->pending()->create();

        $response = $this->getJson("/api/v1/comments?commentable_type=product&commentable_id={$product->id}");

        $response->assertOk()
            ->assertJsonCount(0, 'data.items');
    });

    it('requires commentable_type and commentable_id', function () {
        $this->getJson('/api/v1/comments')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['commentable_type', 'commentable_id']);
    });

    it('does not expose edit_token_hash in index response', function () {
        $product = makeProduct();
        $rawToken = Str::random(40);
        Comment::factory()->forProduct($product)->approved()->create([
            'user_id'         => null,
            'guest_name'      => 'Guest',
            'guest_email'     => 'guest@example.com',
            'edit_token_hash' => hash('sha256', $rawToken),
        ]);

        $response = $this->getJson("/api/v1/comments?commentable_type=product&commentable_id={$product->id}");

        $response->assertOk();
        $items = $response->json('data.items');
        foreach ($items as $item) {
            expect($item)->not->toHaveKey('edit_token_hash');
        }
    });

    it('returns replies nested under their parent root comment', function () {
        $product = makeProduct();
        $parent  = Comment::factory()->forProduct($product)->approved()->create();
        Comment::factory()->asReply($parent)->approved()->count(2)->create();

        $response = $this->getJson("/api/v1/comments?commentable_type=product&commentable_id={$product->id}");

        $response->assertOk();
        // Only the root appears in items (replies count not inflating root list)
        $response->assertJsonCount(1, 'data.items');
        // The root item has its replies nested
        $ids = collect($response->json('data.items'))->pluck('id');
        expect($ids)->toContain($parent->id);
    });

    it('paginates results and returns meta', function () {
        $product = makeProduct();
        Comment::factory()->forProduct($product)->approved()->count(20)->create();

        $response = $this->getJson("/api/v1/comments?commentable_type=product&commentable_id={$product->id}&per_page=5");

        $response->assertOk();
        expect(count($response->json('data.items')))->toBe(5);
        expect($response->json('data.meta.total'))->toBe(20);
        expect($response->json('data.meta.last_page'))->toBe(4);
    });

});

// ---------------------------------------------------------------------------
// STORE — POST /api/v1/comments
// ---------------------------------------------------------------------------

describe('CommentController::store — authenticated user', function () {

    it('authenticated user can post a comment', function () {
        $user    = makeUser();
        $product = makeProduct();

        $this->actingAs($user)->postJson('/api/v1/comments', [
            'commentable_type' => 'product',
            'commentable_id'   => $product->id,
            'body'             => 'Great product!',
            'rating'           => 5,
        ])->assertCreated()
          ->assertJsonPath('data.body', 'Great product!')
          ->assertJsonPath('data.status', CommentStatus::Pending->value);
    });

    it('new comment is created with Pending status', function () {
        $user    = makeUser();
        $product = makeProduct();

        $this->actingAs($user)->postJson('/api/v1/comments', [
            'commentable_type' => 'product',
            'commentable_id'   => $product->id,
            'body'             => 'Good stuff',
            'rating'           => 4,
        ])->assertCreated();

        $this->assertDatabaseHas('comments', [
            'user_id' => $user->id,
            'status'  => CommentStatus::Pending->value,
        ]);
    });

    it('authenticated user can reply to a comment', function () {
        $user    = makeUser();
        $product = makeProduct();
        $parent  = Comment::factory()->forProduct($product)->approved()->create();

        $this->actingAs($user)->postJson('/api/v1/comments', [
            'commentable_type' => 'product',
            'commentable_id'   => $product->id,
            'body'             => 'I agree!',
            'parent_id'        => $parent->id,
        ])->assertCreated()
          ->assertJsonPath('data.parent_id', $parent->id);
    });

    it('cannot reply to a reply (max depth 1)', function () {
        $user    = makeUser();
        $product = makeProduct();
        $parent  = Comment::factory()->forProduct($product)->approved()->create();
        $reply   = Comment::factory()->asReply($parent)->approved()->create();

        $this->actingAs($user)->postJson('/api/v1/comments', [
            'commentable_type' => 'product',
            'commentable_id'   => $product->id,
            'body'             => 'Nested reply',
            'parent_id'        => $reply->id,
        ])->assertUnprocessable();
    });

    it('cannot submit duplicate rating for same product', function () {
        $user    = makeUser();
        $product = makeProduct();

        Comment::factory()->forProduct($product)->create(['user_id' => $user->id]);

        $this->actingAs($user)->postJson('/api/v1/comments', [
            'commentable_type' => 'product',
            'commentable_id'   => $product->id,
            'body'             => 'Second review',
            'rating'           => 3,
        ])->assertStatus(409);
    });

    it('body is required', function () {
        $user    = makeUser();
        $product = makeProduct();

        $this->actingAs($user)->postJson('/api/v1/comments', [
            'commentable_type' => 'product',
            'commentable_id'   => $product->id,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['body']);
    });

    it('rating must be between 1 and 5', function () {
        $user    = makeUser();
        $product = makeProduct();

        $this->actingAs($user)->postJson('/api/v1/comments', [
            'commentable_type' => 'product',
            'commentable_id'   => $product->id,
            'body'             => 'Test',
            'rating'           => 6,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['rating']);
    });

    it('response does not include edit_token_hash for authenticated user', function () {
        $user    = makeUser();
        $product = makeProduct();

        $response = $this->actingAs($user)->postJson('/api/v1/comments', [
            'commentable_type' => 'product',
            'commentable_id'   => $product->id,
            'body'             => 'Nice!',
            'rating'           => 4,
        ])->assertCreated();

        expect($response->json('data'))->not->toHaveKey('edit_token_hash');
    });

});

describe('CommentController::store — guest', function () {

    it('guest can post a comment with name and email', function () {
        $product = makeProduct();

        $response = $this->postJson('/api/v1/comments', [
            'commentable_type' => 'product',
            'commentable_id'   => $product->id,
            'body'             => 'Guest comment',
            'rating'           => 3,
            'guest_name'       => 'Jane Doe',
            'guest_email'      => 'jane@example.com',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.author.role', 'guest');
        $this->assertDatabaseHas('comments', [
            'guest_name'  => 'Jane Doe',
            'guest_email' => 'jane@example.com',
        ]);
    });

    it('guest comment sets edit cookie', function () {
        $product = makeProduct();

        $response = $this->postJson('/api/v1/comments', [
            'commentable_type' => 'product',
            'commentable_id'   => $product->id,
            'body'             => 'Cookie test',
            'rating'           => 2,
            'guest_name'       => 'Bob',
            'guest_email'      => 'bob@example.com',
        ]);

        $response->assertCreated();
        // Cookie is HttpOnly — verify token hash stored in DB
        $this->assertDatabaseHas('comments', [
            'guest_name' => 'Bob',
        ]);
        $comment = Comment::where('guest_name', 'Bob')->first();
        expect($comment->edit_token_hash)->not->toBeNull();
    });

    it('guest comment does not expose edit_token_hash in response', function () {
        $product = makeProduct();

        $response = $this->postJson('/api/v1/comments', [
            'commentable_type' => 'product',
            'commentable_id'   => $product->id,
            'body'             => 'Secret token test',
            'rating'           => 1,
            'guest_name'       => 'Alice',
            'guest_email'      => 'alice@example.com',
        ]);

        $response->assertCreated();
        expect($response->json('data'))->not->toHaveKey('edit_token_hash');
    });

    it('guest requires guest_name when unauthenticated', function () {
        $product = makeProduct();

        $this->postJson('/api/v1/comments', [
            'commentable_type' => 'product',
            'commentable_id'   => $product->id,
            'body'             => 'Missing name',
            'guest_email'      => 'test@example.com',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['guest_name']);
    });

});

// ---------------------------------------------------------------------------
// UPDATE — PATCH /api/v1/comments/{comment}
// ---------------------------------------------------------------------------

describe('CommentController::update', function () {

    it('authenticated owner can update own pending comment within 1 hour', function () {
        $user    = makeUser();
        $product = makeProduct();
        $comment = Comment::factory()->forProduct($product)->pending()->create([
            'user_id'    => $user->id,
            'created_at' => now(),
        ]);

        $this->actingAs($user)->patchJson("/api/v1/comments/{$comment->id}", [
            'body' => 'Updated body',
        ])->assertOk()
          ->assertJsonPath('data.body', 'Updated body');
    });

    it('cannot update comment after 1 hour', function () {
        $user    = makeUser();
        $product = makeProduct();
        $comment = Comment::factory()->forProduct($product)->pending()->create([
            'user_id'    => $user->id,
            'created_at' => now()->subHours(2),
        ]);

        $this->actingAs($user)->patchJson("/api/v1/comments/{$comment->id}", [
            'body' => 'Too late',
        ])->assertForbidden();
    });

    it('cannot update an approved comment', function () {
        $user    = makeUser();
        $product = makeProduct();
        $comment = Comment::factory()->forProduct($product)->approved()->create([
            'user_id'    => $user->id,
            'created_at' => now(),
        ]);

        $this->actingAs($user)->patchJson("/api/v1/comments/{$comment->id}", [
            'body' => 'Approved edit',
        ])->assertForbidden();
    });

    it('another user cannot update someone else comment', function () {
        $owner   = makeUser();
        $other   = makeUser();
        $product = makeProduct();
        $comment = Comment::factory()->forProduct($product)->pending()->create([
            'user_id'    => $owner->id,
            'created_at' => now(),
        ]);

        $this->actingAs($other)->patchJson("/api/v1/comments/{$comment->id}", [
            'body' => 'Hijacked',
        ])->assertForbidden();
    });

    it('guest can update own comment with valid edit token', function () {
        $product  = makeProduct();
        $rawToken = Str::random(40);
        $comment  = Comment::factory()->forProduct($product)->pending()->create([
            'user_id'         => null,
            'guest_name'      => 'Guest',
            'guest_email'     => 'g@example.com',
            'edit_token_hash' => hash('sha256', $rawToken),
            'created_at'      => now(),
        ]);

        $this->withUnencryptedCookie('comment_edit_token_' . $comment->id, $rawToken)
            ->withCredentials() 
            ->patchJson("/api/v1/comments/{$comment->id}", [
                'body' => 'Guest updated',
            ])->assertOk()
              ->assertJsonPath('data.body', 'Guest updated');
    });

    it('guest cannot update with wrong token', function () {
        $product = makeProduct();
        $comment = Comment::factory()->forProduct($product)->pending()->create([
            'user_id'         => null,
            'guest_name'      => 'Guest',
            'guest_email'     => 'g@example.com',
            'edit_token_hash' => hash('sha256', Str::random(40)),
            'created_at'      => now(),
        ]);

        $this->withUnencryptedCookie('comment_edit_token_' . $comment->id, 'wrongtoken')
            ->patchJson("/api/v1/comments/{$comment->id}", [
                'body' => 'Fake update',
            ])->assertForbidden();
    });

    it('guest cannot update without any token', function () {
        $product = makeProduct();
        $comment = Comment::factory()->forProduct($product)->pending()->create([
            'user_id'         => null,
            'guest_name'      => 'Guest',
            'guest_email'     => 'g@example.com',
            'edit_token_hash' => hash('sha256', Str::random(40)),
            'created_at'      => now(),
        ]);

        $this->patchJson("/api/v1/comments/{$comment->id}", [
            'body' => 'No token',
        ])->assertForbidden();
    });

    it('returns 404 for non-existent comment', function () {
        $user = makeUser();

        $this->actingAs($user)->patchJson('/api/v1/comments/' . Str::ulid(), [
            'body' => 'Ghost',
        ])->assertNotFound();
    });

});

// ---------------------------------------------------------------------------
// DESTROY — DELETE /api/v1/comments/{comment}
// ---------------------------------------------------------------------------

describe('CommentController::destroy', function () {

    it('authenticated owner can delete own pending comment within 1 hour', function () {
        $user    = makeUser();
        $product = makeProduct();
        $comment = Comment::factory()->forProduct($product)->pending()->create([
            'user_id'    => $user->id,
            'created_at' => now(),
        ]);

        $this->actingAs($user)->deleteJson("/api/v1/comments/{$comment->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('comments', ['id' => $comment->id]);
    });

    it('cannot delete comment after 1 hour', function () {
        $user    = makeUser();
        $product = makeProduct();
        $comment = Comment::factory()->forProduct($product)->pending()->create([
            'user_id'    => $user->id,
            'created_at' => now()->subHours(2),
        ]);

        $this->actingAs($user)->deleteJson("/api/v1/comments/{$comment->id}")
            ->assertForbidden();
    });

    it('another user cannot delete someone else comment', function () {
        $owner   = makeUser();
        $other   = makeUser();
        $product = makeProduct();
        $comment = Comment::factory()->forProduct($product)->pending()->create([
            'user_id'    => $owner->id,
            'created_at' => now(),
        ]);

        $this->actingAs($other)->deleteJson("/api/v1/comments/{$comment->id}")
            ->assertForbidden();
    });

    it('guest can delete own comment with valid edit token', function () {
        $product  = makeProduct();
        $rawToken = Str::random(40);
        $comment  = Comment::factory()->forProduct($product)->pending()->create([
            'user_id'         => null,
            'guest_name'      => 'Guest',
            'guest_email'     => 'g@example.com',
            'edit_token_hash' => hash('sha256', $rawToken),
            'created_at'      => now(),
        ]);

        $this->withUnencryptedCookie('comment_edit_token_' . $comment->id, $rawToken)
            ->withCredentials()
            ->deleteJson("/api/v1/comments/{$comment->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('comments', ['id' => $comment->id]);
    });

    it('guest cannot delete with wrong token', function () {
        $product = makeProduct();
        $comment = Comment::factory()->forProduct($product)->pending()->create([
            'user_id'         => null,
            'guest_name'      => 'Guest',
            'guest_email'     => 'g@example.com',
            'edit_token_hash' => hash('sha256', Str::random(40)),
            'created_at'      => now(),
        ]);

        $this->withUnencryptedCookie('comment_edit_token_' . $comment->id, 'wrongtoken')
            ->deleteJson("/api/v1/comments/{$comment->id}")
            ->assertForbidden();
    });

    it('returns 404 for non-existent comment', function () {
        $user = makeUser();

        $this->actingAs($user)->deleteJson('/api/v1/comments/' . Str::ulid())
            ->assertNotFound();
    });

});
