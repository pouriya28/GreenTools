<?php

use App\Enums\PurchaseRequirement;
use App\Enums\StockStatus;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case & Environment Configuration
|--------------------------------------------------------------------------
*/
pest()
    ->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(function (): void {
        if (! app()->environment('testing')) {
            throw new RuntimeException(
                'SAFETY ABORT: Tests must only run in the testing environment. Current environment: '
                . app()->environment()
            );
        }

        $connection = (string) config('database.default');
        $database   = (string) config("database.connections.{$connection}.database");

        if ($connection !== 'pgsql' || $database !== 'apibackendlaravel_test') {
            throw new RuntimeException(
                "SAFETY ABORT: Expected pgsql/apibackendlaravel_test, but received {$connection}/{$database}."
            );
        }

        // Disable cookie encryption for the guest cart token in tests.
        // The token is already cryptographically secure (bin2hex(random_bytes(32))).
        // This allows withUnencryptedCookie() to pass the raw token directly,
        // and EncryptCookies middleware will skip decryption for this cookie.
        // Called here (not at file level) so it re-applies after any framework flushState().
        \Illuminate\Cookie\Middleware\EncryptCookies::except(['cart_guest_token']);
    })
    ->in('Feature', 'Unit');

/*
|--------------------------------------------------------------------------
| Helper Functions
|--------------------------------------------------------------------------
*/

/**
 * Create a Product that CartService / CartMergeService can work with.
 *
 * CartService reads: is_active, stock_status, stock_quantity,
 * price_toman (not fillable -> written via raw query), has_active_discount,
 * final_price, purchase_requirement, purchase_confirmation_required.
 *
 * Pass $attrs to override any default.
 */
function makePurchasableProduct(array $attrs = []): Product
{
    $product = Product::factory()->create(array_merge([
        'is_active'                      => true,
        'stock_status'                   => StockStatus::InStock,
        'stock_quantity'                 => 10,
        'purchase_requirement'           => PurchaseRequirement::Standard,
        'purchase_confirmation_required' => false,
        'discount_type'                  => null,
        'discount_value'                 => null,
        'weight_grams'                   => 200,
    ], $attrs));

    // price_toman is computed/cached on the row but NOT fillable.
    // Write it directly so CartService snapshot reads a real value.
    DB::table('products')
        ->where('id', $product->id)
        ->update(['price_toman' => 1_500_000]);

    return $product->refresh();
}
