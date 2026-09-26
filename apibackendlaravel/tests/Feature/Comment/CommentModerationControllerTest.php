<?php

use App\Enums\CommentStatus;
use App\Models\Comment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeStaffWith(string ...$permissions): User
{
    $staff = User::factory()->staff()->create();
    foreach ($permissions as $perm) {
        Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'sanctum']);
        $staff->givePermissionTo($perm);
    }
    return $staff;
}

function makeRegularUser(): User
{
    return User::factory()->create();
}

function makeCommentForProduct(?User $user = null): Comment
{
    $product = Product::factory()->create();

    if ($user !== null) {
        return Comment::factory()
            ->forProduct($product)
            ->pending()
            ->create(['user_id' => $user->id]);
    }

    // No user provided — create as authenticated user (not guest)
    return Comment::factory()
        ->forProduct($product)
        ->pending()
        ->create(['user_id' => User::factory()->create()->id]);
}

// ---------------------------------------------------------------------------
// INDEX — GET /api/v1/admin/comments
// ---------------------------------------------------------------------------

describe('CommentModerationController::index', function () {

    it('staff with comments.moderate can list all comments including pending', function () {
        $staff = makeStaffWith('comments.moderate');
        $product = Product::factory()->create();
        Comment::factory()->forProduct($product)->pending()->count(2)->create();
        Comment::factory()->forProduct($product)->approved()->count(3)->create();
        Comment::factory()->forProduct($product)->rejected()->count(1)->create();

        $this->actingAs($staff)->getJson('/api/v1/admin/comments')
            ->assertOk()
            ->assertJsonCount(2, 'data.items');
    });

    it('staff with only comments.view permission is forbidden from moderation index', function () {
        $staff = makeStaffWith('comments.view');

        $this->actingAs($staff)->getJson('/api/v1/admin/comments')
            ->assertForbidden();
    });

    it('regular user cannot access admin comment list', function () {
        $user = makeRegularUser();

        $this->actingAs($user)->getJson('/api/v1/admin/comments')
            ->assertForbidden();
    });

    it('unauthenticated request is rejected', function () {
        $this->getJson('/api/v1/admin/comments')
            ->assertUnauthorized();
    });

    it('can filter by status', function () {
        $staff = makeStaffWith('comments.moderate');
        $product = Product::factory()->create();
        Comment::factory()->forProduct($product)->pending()->count(3)->create();
        Comment::factory()->forProduct($product)->approved()->count(2)->create();

        $this->actingAs($staff)
            ->getJson('/api/v1/admin/comments?status=pending')
            ->assertOk()
            ->assertJsonCount(3, 'data.items');
    });

    it('returns edit_token_hash hidden from admin view too', function () {
        $staff = makeStaffWith('comments.moderate');
        $product = Product::factory()->create();
        Comment::factory()->forProduct($product)->pending()->create([
            'user_id'         => null,
            'guest_name'      => 'Guest',
            'guest_email'     => 'g@example.com',
            'edit_token_hash' => hash('sha256', Str::random(40)),
        ]);

        $response = $this->actingAs($staff)->getJson('/api/v1/admin/comments');
        $response->assertOk();
        foreach ($response->json('data.items') as $item) {
            expect($item)->not->toHaveKey('edit_token_hash');
        }
    });

});

// ---------------------------------------------------------------------------
// APPROVE — PATCH /api/v1/admin/comments/{id}/approve
// ---------------------------------------------------------------------------

describe('CommentModerationController::approve', function () {

    it('staff with comments.moderate can approve a pending comment', function () {
        $staff   = makeStaffWith('comments.moderate');
        $comment = makeCommentForProduct();

        $this->actingAs($staff)
            ->patchJson("/api/v1/admin/comments/{$comment->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', CommentStatus::Approved->value);

        $this->assertDatabaseHas('comments', [
            'id'     => $comment->id,
            'status' => CommentStatus::Approved->value,
        ]);
    });

    it('staff without comments.moderate permission is forbidden', function () {
        $staff   = makeStaffWith('comments.view'); // no moderate permission
        $comment = makeCommentForProduct();

        $this->actingAs($staff)
            ->patchJson("/api/v1/admin/comments/{$comment->id}/approve")
            ->assertForbidden();
    });

    it('regular user cannot approve', function () {
        $user    = makeRegularUser();
        $comment = makeCommentForProduct();

        $this->actingAs($user)
            ->patchJson("/api/v1/admin/comments/{$comment->id}/approve")
            ->assertForbidden();
    });

    it('unauthenticated request is rejected', function () {
        $comment = makeCommentForProduct();

        $this->patchJson("/api/v1/admin/comments/{$comment->id}/approve")
            ->assertUnauthorized();
    });

    it('returns 404 for non-existent comment', function () {
        $staff = makeStaffWith('comments.moderate');

        $this->actingAs($staff)
            ->patchJson('/api/v1/admin/comments/' . Str::ulid() . '/approve')
            ->assertNotFound();
    });

    it('approving an already-approved comment returns ok (idempotent)', function () {
        $staff = makeStaffWith('comments.moderate');
        $product = Product::factory()->create();
        $comment = Comment::factory()->forProduct($product)->approved()->create();

        $this->actingAs($staff)
            ->patchJson("/api/v1/admin/comments/{$comment->id}/approve")
            ->assertOk();
    });

});

// ---------------------------------------------------------------------------
// REJECT — PATCH /api/v1/admin/comments/{id}/reject
// ---------------------------------------------------------------------------

describe('CommentModerationController::reject', function () {

    it('staff with comments.moderate can reject a pending comment', function () {
        $staff   = makeStaffWith('comments.moderate');
        $comment = makeCommentForProduct();

        $this->actingAs($staff)
            ->patchJson("/api/v1/admin/comments/{$comment->id}/reject")
            ->assertOk()
            ->assertJsonPath('data.status', CommentStatus::Rejected->value);

        $this->assertDatabaseHas('comments', [
            'id'     => $comment->id,
            'status' => CommentStatus::Rejected->value,
        ]);
    });

    it('staff without comments.moderate permission is forbidden', function () {
        $staff   = makeStaffWith('comments.view');
        $comment = makeCommentForProduct();

        $this->actingAs($staff)
            ->patchJson("/api/v1/admin/comments/{$comment->id}/reject")
            ->assertForbidden();
    });

    it('regular user cannot reject', function () {
        $user    = makeRegularUser();
        $comment = makeCommentForProduct();

        $this->actingAs($user)
            ->patchJson("/api/v1/admin/comments/{$comment->id}/reject")
            ->assertForbidden();
    });

    it('returns 404 for non-existent comment', function () {
        $staff = makeStaffWith('comments.moderate');

        $this->actingAs($staff)
            ->patchJson('/api/v1/admin/comments/' . Str::ulid() . '/reject')
            ->assertNotFound();
    });

});

// ---------------------------------------------------------------------------
// DESTROY — DELETE /api/v1/admin/comments/{id}
// ---------------------------------------------------------------------------

describe('CommentModerationController::destroy', function () {

    it('staff with comments.delete can hard-delete any comment', function () {
        $staff   = makeStaffWith('comments.delete');
        $comment = makeCommentForProduct();

        $this->actingAs($staff)
            ->deleteJson("/api/v1/admin/comments/{$comment->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('comments', ['id' => $comment->id]);
    });

    it('staff without comments.delete permission is forbidden', function () {
        $staff   = makeStaffWith('comments.moderate');
        $comment = makeCommentForProduct();

        $this->actingAs($staff)
            ->deleteJson("/api/v1/admin/comments/{$comment->id}")
            ->assertForbidden();
    });

    it('regular user cannot delete via admin endpoint', function () {
        $user    = makeRegularUser();
        $comment = makeCommentForProduct();

        $this->actingAs($user)
            ->deleteJson("/api/v1/admin/comments/{$comment->id}")
            ->assertForbidden();
    });

    it('unauthenticated request is rejected', function () {
        $comment = makeCommentForProduct();

        $this->deleteJson("/api/v1/admin/comments/{$comment->id}")
            ->assertUnauthorized();
    });

    it('staff can delete an approved comment', function () {
        $staff = makeStaffWith('comments.delete');
        $product = Product::factory()->create();
        $comment = Comment::factory()->forProduct($product)->approved()->create();

        $this->actingAs($staff)
            ->deleteJson("/api/v1/admin/comments/{$comment->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('comments', ['id' => $comment->id]);
    });

    it('staff can delete a guest comment', function () {
        $staff = makeStaffWith('comments.delete');
        $product = Product::factory()->create();
        $comment = Comment::factory()->forProduct($product)->pending()->create([
            'user_id'         => null,
            'guest_name'      => 'Guest',
            'guest_email'     => 'g@example.com',
            'edit_token_hash' => hash('sha256', Str::random(40)),
        ]);

        $this->actingAs($staff)
            ->deleteJson("/api/v1/admin/comments/{$comment->id}")
            ->assertNoContent();
    });

    it('returns 404 for non-existent comment', function () {
        $staff = makeStaffWith('comments.delete');

        $this->actingAs($staff)
            ->deleteJson('/api/v1/admin/comments/' . Str::ulid())
            ->assertNotFound();
    });

    it('deleting a comment with replies also handles replies gracefully', function () {
        $staff   = makeStaffWith('comments.delete');
        $product = Product::factory()->create();
        $parent  = Comment::factory()->forProduct($product)->approved()->create();
        Comment::factory()->asReply($parent)->approved()->count(2)->create();

        $this->actingAs($staff)
            ->deleteJson("/api/v1/admin/comments/{$parent->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('comments', ['id' => $parent->id]);
    });

});