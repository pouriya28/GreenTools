<?php

use App\Enums\StockStatus;
use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\Product;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prodStaff(array $perms = []): array
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

/** ExchangeRate با status=applied برای ProductService::create() */
function seedExchangeRate(float $rate = 50000.0): ExchangeRate
{
    return ExchangeRate::create([
        'rate'       => $rate,
        'source'     => 'navasan',
        'fetched_at' => now(),
        'status'     => 'applied',
    ]);
}

/** Minimal valid product payload for store() */
function validProductPayload(string $categoryId): array
{
    return [
        'category_id'    => $categoryId,
        'name'           => 'Test Product ' . rand(1000, 9999),
        'price_usd'      => 10.00,
        'stock_quantity' => 5,
        'stock_status'   => 'in_stock',
    ];
}

const PROD_ADMIN = '/api/v1/products/admin';

// ---------------------------------------------------------------------------
// index
// ---------------------------------------------------------------------------

describe('GET /products/admin — index', function () {

    it('returns paginated product list for staff with products.view', function () {
        ['token' => $t] = prodStaff(['products.view']);
        Product::factory()->count(3)->create();

        $this->withToken($t)->getJson(PROD_ADMIN)->assertStatus(200);
    });

    it('includes inactive products (admin sees all)', function () {
        ['token' => $t] = prodStaff(['products.view']);
        $inactive = Product::factory()->inactive()->create();

        $response = $this->withToken($t)->getJson(PROD_ADMIN)->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        expect($ids)->toContain($inactive->id);
    });

    it('filters by is_active=true', function () {
        ['token' => $t] = prodStaff(['products.view']);
        $active   = Product::factory()->create(['is_active' => true]);
        $inactive = Product::factory()->inactive()->create();

        $response = $this->withToken($t)->getJson(PROD_ADMIN . '?is_active=true')->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        expect($ids)->toContain($active->id);
        expect($ids)->not->toContain($inactive->id);
    });

    it('filters by category_id (ULID string)', function () {
        ['token' => $t] = prodStaff(['products.view']);
        $cat  = Category::factory()->create();
        $prod = Product::factory()->create(['category_id' => $cat->id]);
        Product::factory()->create(); // different category

        $response = $this->withToken($t)->getJson(PROD_ADMIN . "?category_id={$cat->id}")
            ->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        expect($ids)->toContain($prod->id);
    });

    it('searches by name', function () {
        ['token' => $t] = prodStaff(['products.view']);
        $prod = Product::factory()->create(['name' => 'UniqueSearchableName']);
        Product::factory()->create(['name' => 'Something Else']);

        $response = $this->withToken($t)->getJson(PROD_ADMIN . '?search=UniqueSearchableName')
            ->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        expect($ids)->toContain($prod->id);
    });

    it('respects per_page (max 50)', function () {
        ['token' => $t] = prodStaff(['products.view']);
        Product::factory()->count(5)->create();

        $response = $this->withToken($t)->getJson(PROD_ADMIN . '?per_page=2')->assertStatus(200);

        expect(count($response->json('data')))->toBeLessThanOrEqual(2);
    });

    it('returns 403 without products.view permission', function () {
        ['token' => $t] = prodStaff([]);

        $this->withToken($t)->getJson(PROD_ADMIN)->assertStatus(403);
    });

    it('returns 401 when unauthenticated', function () {
        $this->getJson(PROD_ADMIN)->assertStatus(401);
    });
});

// ---------------------------------------------------------------------------
// show
// ---------------------------------------------------------------------------

describe('GET /products/admin/{product} — show', function () {

    it('returns a product for staff with products.view', function () {
        ['token' => $t] = prodStaff(['products.view']);
        $product = Product::factory()->create();

        $this->withToken($t)->getJson(PROD_ADMIN . "/{$product->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $product->id);
    });

    it('returns inactive products too (admin view)', function () {
        ['token' => $t] = prodStaff(['products.view']);
        $inactive = Product::factory()->inactive()->create();

        $this->withToken($t)->getJson(PROD_ADMIN . "/{$inactive->id}")
            ->assertStatus(200);
    });

    it('returns 404 for non-existent product', function () {
        ['token' => $t] = prodStaff(['products.view']);

        $this->withToken($t)->getJson(PROD_ADMIN . '/nonexistent')->assertStatus(404);
    });

    it('returns 403 without products.view permission', function () {
        ['token' => $t] = prodStaff([]);
        $product = Product::factory()->create();

        $this->withToken($t)->getJson(PROD_ADMIN . "/{$product->id}")->assertStatus(403);
    });
});

// ---------------------------------------------------------------------------
// store
// ---------------------------------------------------------------------------

describe('POST /products/admin — store', function () {

    it('creates a product and returns 201', function () {
        ['token' => $t] = prodStaff(['products.create']);
        $cat = Category::factory()->create();
        seedExchangeRate();

        $this->withToken($t)->postJson(PROD_ADMIN, validProductPayload($cat->id))
            ->assertStatus(201);
    });

    it('calculates price_toman from price_usd and exchange rate', function () {
        ['token' => $t] = prodStaff(['products.create']);
        $cat = Category::factory()->create();
        seedExchangeRate(60000.0);

        $response = $this->withToken($t)->postJson(PROD_ADMIN, [
            ...validProductPayload($cat->id),
            'price_usd' => 10.00,
        ])->assertStatus(201);

        // 10 * 60000 = 600000 تومان
        $product = Product::find($response->json('data.id'));
        expect($product->price_toman)->toBe(600000);
    });

    it('returns 422 when no exchange rate exists', function () {
        ['token' => $t] = prodStaff(['products.create']);
        $cat = Category::factory()->create();
        // بدون seedExchangeRate

        $this->withToken($t)->postJson(PROD_ADMIN, validProductPayload($cat->id))
            ->assertStatus(422);
    });

    it('returns 422 when price_usd is missing', function () {
        ['token' => $t] = prodStaff(['products.create']);
        $cat = Category::factory()->create();

        $payload = validProductPayload($cat->id);
        unset($payload['price_usd']);

        $this->withToken($t)->postJson(PROD_ADMIN, $payload)
            ->assertStatus(422)->assertJsonValidationErrors(['price_usd']);
    });

    it('returns 422 when category_id does not exist', function () {
        ['token' => $t] = prodStaff(['products.create']);
        seedExchangeRate();

        $this->withToken($t)->postJson(PROD_ADMIN, [
            'category_id'    => '01JAAAAAAAAAAAAAAAAAAAAAA',
            'name'           => 'Bad Cat',
            'price_usd'      => 10.00,
            'stock_quantity' => 1,
            'stock_status'   => 'in_stock',
        ])->assertStatus(422)->assertJsonValidationErrors(['category_id']);
    });

    it('returns 422 for invalid stock_status', function () {
        ['token' => $t] = prodStaff(['products.create']);
        $cat = Category::factory()->create();
        seedExchangeRate();

        $payload = validProductPayload($cat->id);
        $payload['stock_status'] = 'invalid_status';

        $this->withToken($t)->postJson(PROD_ADMIN, $payload)
            ->assertStatus(422)->assertJsonValidationErrors(['stock_status']);
    });

    it('returns 422 for duplicate SKU', function () {
        ['token' => $t] = prodStaff(['products.create']);
        $cat = Category::factory()->create();
        Product::factory()->create(['sku' => 'EXISTING-SKU']);
        seedExchangeRate();

        $payload = validProductPayload($cat->id);
        $payload['sku'] = 'EXISTING-SKU';

        $this->withToken($t)->postJson(PROD_ADMIN, $payload)
            ->assertStatus(422)->assertJsonValidationErrors(['sku']);
    });

    it('returns 403 without products.create permission', function () {
        ['token' => $t] = prodStaff(['products.view']);
        $cat = Category::factory()->create();

        $this->withToken($t)->postJson(PROD_ADMIN, validProductPayload($cat->id))
            ->assertStatus(403);
    });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

describe('PATCH /products/admin/{product} — update', function () {

    it('updates a product and returns 200', function () {
        ['token' => $t] = prodStaff(['products.update']);
        $product = Product::factory()->create(['name' => 'Old Name']);

        $this->withToken($t)->patchJson(PROD_ADMIN . "/{$product->id}", [
            'name' => 'Updated Name',
        ])->assertStatus(200);

        $this->assertDatabaseHas('products', ['id' => $product->id, 'name' => 'Updated Name']);
    });

    it('recalculates price_toman when price_usd changes', function () {
        ['token' => $t] = prodStaff(['products.update']);
        $product = Product::factory()->create(['price_usd' => 10, 'price_toman' => 500000]);
        seedExchangeRate(70000.0);

        $this->withToken($t)->patchJson(PROD_ADMIN . "/{$product->id}", [
            'price_usd' => 5.00,
        ])->assertStatus(200);

        expect($product->fresh()->price_toman)->toBe((int)(5 * 70000));
    });

    it('returns 404 for non-existent product', function () {
        ['token' => $t] = prodStaff(['products.update']);

        $this->withToken($t)->patchJson(PROD_ADMIN . '/nonexistent', ['name' => 'X'])
            ->assertStatus(404);
    });

    it('returns 403 without products.update permission', function () {
        ['token' => $t] = prodStaff(['products.view']);
        $product = Product::factory()->create();

        $this->withToken($t)->patchJson(PROD_ADMIN . "/{$product->id}", ['name' => 'X'])
            ->assertStatus(403);
    });
});

// ---------------------------------------------------------------------------
// destroy (soft delete) — Bug was: 'manage' instead of 'delete'
// ---------------------------------------------------------------------------

describe('DELETE /products/admin/{product} — destroy', function () {

    it('soft-deletes a product and returns 200', function () {
        ['token' => $t] = prodStaff(['products.delete']);
        $product = Product::factory()->create();

        $this->withToken($t)->deleteJson(PROD_ADMIN . "/{$product->id}")
            ->assertStatus(200);

        $this->assertSoftDeleted('products', ['id' => $product->id]);
    });

    it('staff with only products.delete (not products.manage) can delete', function () {
        // این تست باگ قبلی رو پوشش می‌ده:
        // قبلاً controller از 'manage' استفاده می‌کرد — فقط products.manage اجازه داشت
        // الان از 'delete' استفاده می‌کنه — products.delete هم کافیه
        ['token' => $t] = prodStaff(['products.delete']); // فقط delete، نه manage

        Permission::firstOrCreate(['name' => 'products.manage', 'guard_name' => 'sanctum']);
        // products.manage به این user داده نشده

        $product = Product::factory()->create();

        $this->withToken($t)->deleteJson(PROD_ADMIN . "/{$product->id}")
            ->assertStatus(200); // باید 200 باشه، نه 403
    });

    it('returns 403 without products.delete permission', function () {
        ['token' => $t] = prodStaff(['products.view']);
        $product = Product::factory()->create();

        $this->withToken($t)->deleteJson(PROD_ADMIN . "/{$product->id}")
            ->assertStatus(403);
    });

    it('returns 404 for non-existent product', function () {
        ['token' => $t] = prodStaff(['products.delete']);

        $this->withToken($t)->deleteJson(PROD_ADMIN . '/nonexistent')->assertStatus(404);
    });
});

// ---------------------------------------------------------------------------
// toggleFeatured — Bug was: 'manage' instead of 'update'
// ---------------------------------------------------------------------------

describe('PATCH /products/admin/{product}/toggle-featured', function () {

    it('toggles is_featured from false to true', function () {
        ['token' => $t] = prodStaff(['products.update']);
        $product = Product::factory()->create(['is_featured' => false]);

        $this->withToken($t)->patchJson(PROD_ADMIN . "/{$product->id}/toggle-featured")
            ->assertStatus(200);

        expect($product->fresh()->is_featured)->toBeTrue();
    });

    it('toggles is_featured from true to false', function () {
        ['token' => $t] = prodStaff(['products.update']);
        $product = Product::factory()->featured()->create();

        $this->withToken($t)->patchJson(PROD_ADMIN . "/{$product->id}/toggle-featured")
            ->assertStatus(200);

        expect($product->fresh()->is_featured)->toBeFalse();
    });

    it('staff with only products.update (not products.manage) can toggle', function () {
        // همون باگ قبلی: الان درست شده
        ['token' => $t] = prodStaff(['products.update']); // فقط update، نه manage
        $product = Product::factory()->create(['is_featured' => false]);

        $this->withToken($t)->patchJson(PROD_ADMIN . "/{$product->id}/toggle-featured")
            ->assertStatus(200);
    });

    it('returns 422 when max featured products (12) reached', function () {
        ['token' => $t] = prodStaff(['products.update']);
        // 12 محصول ویژه می‌سازیم
        Product::factory()->count(12)->featured()->create();
        $extra = Product::factory()->create(['is_featured' => false]);

        $this->withToken($t)->patchJson(PROD_ADMIN . "/{$extra->id}/toggle-featured")
            ->assertStatus(422);
    });

    it('returns 403 without products.update permission', function () {
        ['token' => $t] = prodStaff(['products.view']);
        $product = Product::factory()->create();

        $this->withToken($t)->patchJson(PROD_ADMIN . "/{$product->id}/toggle-featured")
            ->assertStatus(403);
    });
});

// ---------------------------------------------------------------------------
// trash
// ---------------------------------------------------------------------------

describe('GET /products/admin/trash — trash', function () {

    it('lists soft-deleted products', function () {
        ['token' => $t] = prodStaff(['products.trash']);
        $product = Product::factory()->create();
        $product->delete();

        $response = $this->withToken($t)->getJson(PROD_ADMIN . '/trash')
            ->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        expect($ids)->toContain($product->id);
    });

    it('does not include active products in trash', function () {
        ['token' => $t] = prodStaff(['products.trash']);
        $live = Product::factory()->create();

        $response = $this->withToken($t)->getJson(PROD_ADMIN . '/trash')
            ->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        expect($ids)->not->toContain($live->id);
    });

    it('returns 403 without products.trash permission', function () {
        ['token' => $t] = prodStaff(['products.view']);

        $this->withToken($t)->getJson(PROD_ADMIN . '/trash')->assertStatus(403);
    });
});

// ---------------------------------------------------------------------------
// restore
// ---------------------------------------------------------------------------

describe('POST /products/admin/{id}/restore — restore', function () {

    it('restores a soft-deleted product', function () {
        ['token' => $t] = prodStaff(['products.trash']);
        $product = Product::factory()->create();
        $product->delete();

        $this->withToken($t)->postJson(PROD_ADMIN . "/{$product->id}/restore")
            ->assertStatus(200);

        $this->assertDatabaseHas('products', ['id' => $product->id, 'deleted_at' => null]);
    });

    it('returns 404 for a non-deleted product', function () {
        ['token' => $t] = prodStaff(['products.trash']);
        $product = Product::factory()->create();

        $this->withToken($t)->postJson(PROD_ADMIN . "/{$product->id}/restore")
            ->assertStatus(404);
    });

    it('returns 403 without products.trash permission', function () {
        ['token' => $t] = prodStaff(['products.view']);
        $product = Product::factory()->create();
        $product->delete();

        $this->withToken($t)->postJson(PROD_ADMIN . "/{$product->id}/restore")
            ->assertStatus(403);
    });
});

// ---------------------------------------------------------------------------
// forceDestroy
// ---------------------------------------------------------------------------

describe('DELETE /products/admin/{id}/force — forceDestroy', function () {

    it('permanently deletes a trashed product', function () {
        ['token' => $t] = prodStaff(['products.trash']);
        $product = Product::factory()->create();
        $product->delete();

        $this->withToken($t)->deleteJson(PROD_ADMIN . "/{$product->id}/force")
            ->assertStatus(200);

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    });

    it('returns 404 for a live (non-trashed) product', function () {
        ['token' => $t] = prodStaff(['products.trash']);
        $product = Product::factory()->create();

        $this->withToken($t)->deleteJson(PROD_ADMIN . "/{$product->id}/force")
            ->assertStatus(404);
    });

    it('returns 403 without products.trash permission', function () {
        ['token' => $t] = prodStaff(['products.view']);
        $product = Product::factory()->create();
        $product->delete();

        $this->withToken($t)->deleteJson(PROD_ADMIN . "/{$product->id}/force")
            ->assertStatus(403);
    });
});

// ---------------------------------------------------------------------------
// Public ProductController
// ---------------------------------------------------------------------------

describe('GET /products — public index', function () {

    it('returns only active products', function () {
        $active   = Product::factory()->create(['is_active' => true]);
        $inactive = Product::factory()->inactive()->create();

        $response = $this->getJson('/api/v1/products')->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        expect($ids)->toContain($active->id);
        expect($ids)->not->toContain($inactive->id);
    });

    it('does not require authentication', function () {
        $this->getJson('/api/v1/products')->assertStatus(200);
    });
});

describe('GET /products/featured — public featured', function () {

    it('returns only active featured products', function () {
        $featured    = Product::factory()->featured()->create(['is_active' => true]);
        $notFeatured = Product::factory()->create(['is_active' => true, 'is_featured' => false]);

        $response = $this->getJson('/api/v1/products/featured')->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');
        expect($ids)->toContain($featured->id);
        expect($ids)->not->toContain($notFeatured->id);
    });
});

describe('GET /products/{slug} — public show', function () {

    it('returns an active product by slug', function () {
        $product = Product::factory()->create(['is_active' => true]);

        $this->getJson("/api/v1/products/{$product->slug}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $product->id);
    });

    it('increments views_count on each request', function () {
        $product = Product::factory()->create(['is_active' => true, 'views_count' => 0]);

        $this->getJson("/api/v1/products/{$product->slug}");

        expect($product->fresh()->views_count)->toBe(1);
    });

    it('returns 404 for inactive product', function () {
        $product = Product::factory()->inactive()->create();

        $this->getJson("/api/v1/products/{$product->slug}")->assertStatus(404);
    });

    it('returns 404 for soft-deleted product', function () {
        $product = Product::factory()->create();
        $product->delete();

        $this->getJson("/api/v1/products/{$product->slug}")->assertStatus(404);
    });

    it('returns 404 for non-existent slug', function () {
        $this->getJson('/api/v1/products/ghost-slug')->assertStatus(404);
    });
});
