<?php

use App\Models\Category;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function catStaff(array $perms = []): array
{
    $user = User::factory()->staff()->create();

    foreach ($perms as $p) {
        Permission::firstOrCreate(['name' => $p, 'guard_name' => 'sanctum']);
    }

    app(PermissionRegistrar::class)->forgetCachedPermissions();

    if ($perms) {
        $user->givePermissionTo($perms);
    }

    $token = $user->createToken('test', ['*'])->plainTextToken;

    return ['user' => $user, 'token' => $token];
}

const CAT_ADMIN = '/api/v1/categories/admin';

// ---------------------------------------------------------------------------
// index
// ---------------------------------------------------------------------------

describe('GET /categories/admin — index', function () {

    it('returns category list for staff with categories.view', function () {
        ['token' => $t] = catStaff(['categories.view']);
        Category::factory()->count(3)->create();

        $this->withToken($t)->getJson(CAT_ADMIN)
            ->assertStatus(200);
    });

    it('returns 403 when permission is missing', function () {
        ['token' => $t] = catStaff([]); // no permissions

        $this->withToken($t)->getJson(CAT_ADMIN)->assertStatus(403);
    });

    it('returns 401 when unauthenticated', function () {
        $this->getJson(CAT_ADMIN)->assertStatus(401);
    });

    it('returns 403 for a customer account', function () {
        $customer = User::factory()->customer()->create();
        $token    = $customer->createToken('test', ['*'])->plainTextToken;

        $this->withToken($token)->getJson(CAT_ADMIN)->assertStatus(403);
    });

    it('only returns root-level categories in index', function () {
        ['token' => $t] = catStaff(['categories.view']);
        $root  = Category::factory()->create();
        $child = Category::factory()->create(['parent_id' => $root->id]);

        $response = $this->withToken($t)->getJson(CAT_ADMIN)->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        expect($ids)->toContain($root->id);
        expect($ids)->not->toContain($child->id);
    });
});

// ---------------------------------------------------------------------------
// store
// ---------------------------------------------------------------------------

describe('POST /categories/admin — store', function () {

    it('creates a category and returns 201', function () {
        ['token' => $t] = catStaff(['categories.create']);

        $this->withToken($t)->postJson(CAT_ADMIN, [
            'name'      => 'Electronics',
            'is_active' => true,
        ])->assertStatus(201);

        $this->assertDatabaseHas('categories', ['name' => 'Electronics']);
    });

    it('auto-generates a slug from name', function () {
        ['token' => $t] = catStaff(['categories.create']);

        $response = $this->withToken($t)->postJson(CAT_ADMIN, [
            'name' => 'Auto Slug Test',
        ])->assertStatus(201);

        expect($response->json('data.slug'))->toContain('auto-slug-test');
    });

    it('accepts a valid parent_id (ULID string)', function () {
        ['token' => $t] = catStaff(['categories.create']);
        $parent = Category::factory()->create();

        $this->withToken($t)->postJson(CAT_ADMIN, [
            'name'      => 'Child Category',
            'parent_id' => $parent->id, // ULID string — was integer bug, now fixed
        ])->assertStatus(201);
    });

    it('returns 422 for an invalid (non-existent) parent_id', function () {
        ['token' => $t] = catStaff(['categories.create']);

        $this->withToken($t)->postJson(CAT_ADMIN, [
            'name'      => 'Orphan',
            'parent_id' => '01JAAAAAAAAAAAAAAAAAAAAAA', // does not exist
        ])->assertStatus(422)->assertJsonValidationErrors(['parent_id']);
    });

    it('returns 422 when name is missing', function () {
        ['token' => $t] = catStaff(['categories.create']);

        $this->withToken($t)->postJson(CAT_ADMIN, [])
            ->assertStatus(422)->assertJsonValidationErrors(['name']);
    });

    it('returns 422 when name is too short', function () {
        ['token' => $t] = catStaff(['categories.create']);

        $this->withToken($t)->postJson(CAT_ADMIN, ['name' => 'A'])
            ->assertStatus(422)->assertJsonValidationErrors(['name']);
    });

    it('returns 403 without categories.create permission', function () {
        ['token' => $t] = catStaff(['categories.view']);

        $this->withToken($t)->postJson(CAT_ADMIN, ['name' => 'New Cat'])
            ->assertStatus(403);
    });

    it('returns 422 when parent is at maximum depth (MAX_DEPTH = 4)', function () {
        ['token' => $t] = catStaff(['categories.create']);

        // ساخت ۵ سطح (depth 0→4) — اضافه کردن بچه به depth 4 باید رد بشه
        $cat = Category::factory()->create();
        for ($i = 0; $i < 4; $i++) {
            $cat = Category::factory()->create(['parent_id' => $cat->id]);
        }

        $this->withToken($t)->postJson(CAT_ADMIN, [
            'name'      => 'Too Deep',
            'parent_id' => $cat->id,
        ])->assertStatus(422)->assertJsonValidationErrors(['parent_id']);
    });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

describe('PATCH /categories/admin/{category} — update', function () {

    it('updates a category and returns 200', function () {
        ['token' => $t] = catStaff(['categories.update']);
        $cat = Category::factory()->create(['name' => 'Old Name']);

        $this->withToken($t)->patchJson(CAT_ADMIN . "/{$cat->id}", [
            'name' => 'New Name',
        ])->assertStatus(200);

        $this->assertDatabaseHas('categories', ['id' => $cat->id, 'name' => 'New Name']);
    });

    it('returns 403 without categories.update permission', function () {
        ['token' => $t] = catStaff(['categories.view']);
        $cat = Category::factory()->create();

        $this->withToken($t)->patchJson(CAT_ADMIN . "/{$cat->id}", ['name' => 'X'])
            ->assertStatus(403);
    });

    it('returns 404 for a non-existent category', function () {
        ['token' => $t] = catStaff(['categories.update']);

        $this->withToken($t)->patchJson(CAT_ADMIN . '/nonexistent', ['name' => 'X'])
            ->assertStatus(404);
    });

    it('cannot set a descendant as parent (circular)', function () {
        ['token' => $t] = catStaff(['categories.update']);
        $parent = Category::factory()->create();
        $child  = Category::factory()->create(['parent_id' => $parent->id]);

        $this->withToken($t)->patchJson(CAT_ADMIN . "/{$parent->id}", [
            'parent_id' => $child->id, // child as parent of its own parent
        ])->assertStatus(422);
    });

    it('cannot set a category as its own parent', function () {
        ['token' => $t] = catStaff(['categories.update']);
        $cat = Category::factory()->create();

        $this->withToken($t)->patchJson(CAT_ADMIN . "/{$cat->id}", [
            'parent_id' => $cat->id,
        ])->assertStatus(422);
    });
});

// ---------------------------------------------------------------------------
// destroy (soft delete)
// ---------------------------------------------------------------------------

describe('DELETE /categories/admin/{category} — destroy', function () {

    it('soft-deletes a leaf category and returns 200', function () {
        ['token' => $t] = catStaff(['categories.delete']);
        $cat = Category::factory()->create();

        $this->withToken($t)->deleteJson(CAT_ADMIN . "/{$cat->id}")
            ->assertStatus(200);

        $this->assertSoftDeleted('categories', ['id' => $cat->id]);
    });

    it('returns 422 when category has children', function () {
        ['token' => $t] = catStaff(['categories.delete']);
        $parent = Category::factory()->create();
        Category::factory()->create(['parent_id' => $parent->id]);

        $this->withToken($t)->deleteJson(CAT_ADMIN . "/{$parent->id}")
            ->assertStatus(422);
    });

    it('returns 403 without categories.delete permission', function () {
        ['token' => $t] = catStaff(['categories.view']);
        $cat = Category::factory()->create();

        $this->withToken($t)->deleteJson(CAT_ADMIN . "/{$cat->id}")
            ->assertStatus(403);
    });

    it('returns 404 for a non-existent category', function () {
        ['token' => $t] = catStaff(['categories.delete']);

        $this->withToken($t)->deleteJson(CAT_ADMIN . '/nonexistent')
            ->assertStatus(404);
    });
});

// ---------------------------------------------------------------------------
// trash
// ---------------------------------------------------------------------------

describe('GET /categories/admin/trash — trash', function () {

    it('lists soft-deleted categories for staff with categories.trash', function () {
        ['token' => $t] = catStaff(['categories.trash']);
        $cat = Category::factory()->create();
        $cat->delete();

        $response = $this->withToken($t)->getJson(CAT_ADMIN . '/trash')
            ->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        expect($ids)->toContain($cat->id);
    });

    it('does not show active categories in trash', function () {
        ['token' => $t] = catStaff(['categories.trash']);
        $live = Category::factory()->create();

        $response = $this->withToken($t)->getJson(CAT_ADMIN . '/trash')
            ->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        expect($ids)->not->toContain($live->id);
    });

    it('returns 403 without categories.trash permission', function () {
        ['token' => $t] = catStaff(['categories.view']);

        $this->withToken($t)->getJson(CAT_ADMIN . '/trash')->assertStatus(403);
    });
});

// ---------------------------------------------------------------------------
// restore
// ---------------------------------------------------------------------------

describe('POST /categories/admin/{id}/restore — restore', function () {

    it('restores a soft-deleted category', function () {
        ['token' => $t] = catStaff(['categories.trash']);
        $cat = Category::factory()->create();
        $cat->delete();

        $this->withToken($t)->postJson(CAT_ADMIN . "/{$cat->id}/restore")
            ->assertStatus(200);

        $this->assertDatabaseHas('categories', ['id' => $cat->id, 'deleted_at' => null]);
    });

    it('returns 404 for a non-deleted category', function () {
        ['token' => $t] = catStaff(['categories.trash']);
        $cat = Category::factory()->create(); // not deleted

        $this->withToken($t)->postJson(CAT_ADMIN . "/{$cat->id}/restore")
            ->assertStatus(404);
    });

    it('returns 403 without categories.trash permission', function () {
        ['token' => $t] = catStaff(['categories.view']);
        $cat = Category::factory()->create();
        $cat->delete();

        $this->withToken($t)->postJson(CAT_ADMIN . "/{$cat->id}/restore")
            ->assertStatus(403);
    });

    it('returns 422 when parent was deleted while in trash', function () {
        ['token' => $t] = catStaff(['categories.trash']);
        $parent = Category::factory()->create();
        $child  = Category::factory()->create(['parent_id' => $parent->id]);
        $child->delete();
        $parent->delete();// parent permanently gone

        $this->withToken($t)->postJson(CAT_ADMIN . "/{$child->id}/restore")
            ->assertStatus(422);
    });
});

// ---------------------------------------------------------------------------
// forceDestroy
// ---------------------------------------------------------------------------

describe('DELETE /categories/admin/{id}/force — forceDestroy', function () {

    it('permanently deletes a soft-deleted category', function () {
        ['token' => $t] = catStaff(['categories.trash']);
        $cat = Category::factory()->create();
        $cat->delete();

        $this->withToken($t)->deleteJson(CAT_ADMIN . "/{$cat->id}/force")
            ->assertStatus(200);

        $this->assertDatabaseMissing('categories', ['id' => $cat->id]);
    });

    it('returns 404 for a live (non-trashed) category', function () {
        ['token' => $t] = catStaff(['categories.trash']);
        $cat = Category::factory()->create(); // not in trash

        $this->withToken($t)->deleteJson(CAT_ADMIN . "/{$cat->id}/force")
            ->assertStatus(404);
    });

    it('returns 422 when category has children (including trashed)', function () {
        ['token' => $t] = catStaff(['categories.trash']);
        $parent = Category::factory()->create();
        Category::factory()->create(['parent_id' => $parent->id]); // child exists
        $parent->delete();

        $this->withToken($t)->deleteJson(CAT_ADMIN . "/{$parent->id}/force")
            ->assertStatus(422);
    });

    it('returns 403 without categories.trash permission', function () {
        ['token' => $t] = catStaff(['categories.view']);
        $cat = Category::factory()->create();
        $cat->delete();

        $this->withToken($t)->deleteJson(CAT_ADMIN . "/{$cat->id}/force")
            ->assertStatus(403);
    });
});

// ---------------------------------------------------------------------------
// Public CategoryController
// ---------------------------------------------------------------------------

describe('GET /categories — public index', function () {

    it('returns only active root-level categories', function () {
        $active   = Category::factory()->create(['is_active' => true]);
        $inactive = Category::factory()->create(['is_active' => false]);

        $response = $this->getJson('/api/v1/categories')->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        expect($ids)->toContain($active->id);
        expect($ids)->not->toContain($inactive->id);
    });

    it('does not require authentication', function () {
        $this->getJson('/api/v1/categories')->assertStatus(200);
    });
});

describe('GET /categories/{slug} — public show', function () {

    it('returns an active category by slug', function () {
        $cat = Category::factory()->create(['slug' => 'electronics', 'is_active' => true]);

        $this->getJson('/api/v1/categories/electronics')
            ->assertStatus(200)
            ->assertJsonPath('data.id', $cat->id);
    });

    it('returns 404 for an inactive category', function () {
        Category::factory()->create(['slug' => 'hidden-cat', 'is_active' => false]);

        $this->getJson('/api/v1/categories/hidden-cat')->assertStatus(404);
    });

    it('returns 404 for a non-existent slug', function () {
        $this->getJson('/api/v1/categories/ghost-slug')->assertStatus(404);
    });
});
