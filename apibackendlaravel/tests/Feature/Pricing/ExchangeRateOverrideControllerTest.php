<?php

use App\Models\ExchangeRate;
use App\Models\Product;
use App\Models\User;
use App\Services\Pricing\ExchangeRateProviderInterface;
use App\Services\Pricing\DTOs\FetchedRate;
use App\Services\Pricing\Exceptions\ExchangeRateFetchException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAdminWithExchangeRatePermission(): User
{
    $admin = User::factory()->staff()->create();
    \Spatie\Permission\Models\Permission::firstOrCreate([
        'name'       => 'exchange-rates.manage',
        'guard_name' => 'sanctum',
    ]);
    $admin->givePermissionTo('exchange-rates.manage');
    return $admin;
}

function makeStaffWithoutPermission(): User
{
    return User::factory()->staff()->create();
}

function makeRateRecord(float $rate, string $status = 'pending_review', ?string $fetchedAt = null): ExchangeRate
{
    return ExchangeRate::create([
        'rate'       => $rate,
        'status'     => $status,
        'fetched_at' => $fetchedAt ? \Carbon\Carbon::parse($fetchedAt) : now(),
        'source'     => 'manual_admin',
    ]);
}

function makeUsdProductForFeature(float $priceUsd = 10.0): Product
{
    $product = Product::factory()->create(['is_active' => true]);
    DB::table('products')->where('id', $product->id)->update([
        'price_usd'   => $priceUsd,
        'price_toman' => 500_000,
    ]);
    return $product->refresh();
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(function (): void {
    Http::preventStrayRequests();
    Mail::fake();
});

// ---------------------------------------------------------------------------
// store (manual override)
// ---------------------------------------------------------------------------

it('store creates an ExchangeRate with status pending_review', function (): void {
    $admin = makeAdminWithExchangeRatePermission();
    makeUsdProductForFeature();

    $this->actingAs($admin)
        ->postJson('/api/v1/admin/exchange-rates/override', [
            'rate'   => 650_000,
            'reason' => 'تست override',
        ])
        ->assertCreated();

    expect(ExchangeRate::where('status', 'pending_review')->where('source', 'manual_admin')->exists())->toBeTrue();
});

it('store creates price proposals for all USD products', function (): void {
    $admin = makeAdminWithExchangeRatePermission();
    makeUsdProductForFeature(10.0);
    makeUsdProductForFeature(20.0);

    $response = $this->actingAs($admin)
        ->postJson('/api/v1/admin/exchange-rates/override', [
            'rate'   => 650_000,
            'reason' => 'تست override دستی برای بررسی',
        ])
        ->assertCreated()
        ->assertJsonStructure(['exchange_rate_id', 'batch_id']);

    $batchId = $response->json('batch_id');
    expect(\App\Models\ProductPriceProposal::where('batch_id', $batchId)->count())->toBe(2);
});

it('store returns 403 for a staff member without exchange-rates.manage', function (): void {
    $staff = makeStaffWithoutPermission();

    $this->actingAs($staff)
        ->postJson('/api/v1/admin/exchange-rates/override', ['rate' => 75_000, 'reason' => 'test'])
        ->assertStatus(403);
});

it('store returns 401 for an unauthenticated request', function (): void {
    $this->postJson('/api/v1/admin/exchange-rates/override', ['rate' => 75_000, 'reason' => 'test'])
        ->assertStatus(401);
});

// ---------------------------------------------------------------------------
// current — non-rejected only (regression)
// ---------------------------------------------------------------------------

it('current returns the latest non-rejected rate', function (): void {
    makeRateRecord(50_000, 'rejected', now()->subHours(2)->toIso8601String());
    makeRateRecord(70_000, 'pending_review', now()->subHour()->toIso8601String());

    $admin = makeAdminWithExchangeRatePermission();

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/exchange-rates/current')
        ->assertOk()
        ->assertJsonPath('data.status', 'pending_review');
});

it('REGRESSION: current never returns a fully-rejected rate', function (): void {
    // Bug: the previous implementation returned the latest rate regardless of
    // status. A rejected rate could leak back as the "current" reference value
    // in the manual-override dialog, misleading the admin into thinking it was
    // the active rate.
    makeRateRecord(99_999, 'rejected', now()->toIso8601String());
    // No non-rejected rate exists
    $admin = makeAdminWithExchangeRatePermission();

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/exchange-rates/current')
        ->assertOk()
        ->assertJsonPath('data', null);
});

it('REGRESSION: current requires exchange-rates.manage permission', function (): void {
    // Bug: current() had no permission check — any logged-in staff could read
    // the exchange rate source and fetched_at, leaking operational details.
    makeRateRecord(70_000, 'pending_review');
    $staff = makeStaffWithoutPermission();

    $this->actingAs($staff)
        ->getJson('/api/v1/admin/exchange-rates/current')
        ->assertStatus(403);
});

it('current returns null data when no non-rejected rate exists', function (): void {
    $admin = makeAdminWithExchangeRatePermission();

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/exchange-rates/current')
        ->assertOk()
        ->assertJsonPath('data', null);
});

// ---------------------------------------------------------------------------
// confirmCurrent
// ---------------------------------------------------------------------------

it('confirmCurrent marks the latest pending rate as applied', function (): void {
    makeRateRecord(70_000, 'pending_review');
    $admin = makeAdminWithExchangeRatePermission();

    $this->actingAs($admin)
        ->postJson('/api/v1/admin/exchange-rates/confirm')
        ->assertOk();

    expect(ExchangeRate::where('status', 'applied')->exists())->toBeTrue();
});

it('confirmCurrent returns 404 when no non-rejected rate exists', function (): void {
    $admin = makeAdminWithExchangeRatePermission();

    $this->actingAs($admin)
        ->postJson('/api/v1/admin/exchange-rates/confirm')
        ->assertStatus(404);
});

it('REGRESSION: confirmCurrent never reactivates a fully-rejected rate', function (): void {
    // Bug: confirmCurrent used to call ExchangeRate::latest('fetched_at')->first(),
    // which could return a rejected rate and re-mark it as applied — effectively
    // undoing a deliberate rejection by the admin team.
    makeRateRecord(99_999, 'rejected', now()->toIso8601String());
    $admin = makeAdminWithExchangeRatePermission();

    $this->actingAs($admin)
        ->postJson('/api/v1/admin/exchange-rates/confirm')
        ->assertStatus(404);

    expect(ExchangeRate::where('status', 'applied')->exists())->toBeFalse();
});

it('confirmCurrent is idempotent — calling it twice does not error', function (): void {
    makeRateRecord(70_000, 'pending_review');
    $admin = makeAdminWithExchangeRatePermission();

    $this->actingAs($admin)->postJson('/api/v1/admin/exchange-rates/confirm')->assertOk();
    $this->actingAs($admin)->postJson('/api/v1/admin/exchange-rates/confirm')->assertOk();

    expect(ExchangeRate::where('status', 'applied')->count())->toBe(1);
});

// ---------------------------------------------------------------------------
// fetchNow — external API fetch
// ---------------------------------------------------------------------------

it('fetchNow creates a rate and batch from a successful API response', function (): void {
    config([
        'services.navasan.api_key'       => 'fake-key',
        'services.navasan.base_url'      => 'https://api.navasan.test/latest',
        'services.navasan.usd_rate_key'  => 'usd',
        'services.navasan.min_sane_rate' => 10_000,
        'services.navasan.max_sane_rate' => 999_999_999,
    ]);

    Http::fake([
        'api.navasan.test/*' => Http::response(['usd' => ['value' => '650000']], 200),
    ]);

    makeUsdProductForFeature();
    $admin = makeAdminWithExchangeRatePermission();

    $this->actingAs($admin)
        ->postJson('/api/v1/admin/exchange-rates/fetch-now')
        ->assertCreated()
        ->assertJsonStructure(['exchange_rate_id', 'batch_id', 'rate']);

    expect(ExchangeRate::where('source', 'manual_fetch')->exists())->toBeTrue();
});

it('REGRESSION: fetchNow rejects a rate outside the sane range without writing to the DB', function (): void {
    // Bug: fetchNow had no sane-range guard. A corrupted API response could
    // slip a nonsensical rate (e.g. 1 or 999_999_999_999) directly into
    // pending_review with a full batch of price proposals attached.
    config([
        'services.navasan.api_key'       => 'fake-key',
        'services.navasan.base_url'      => 'https://api.navasan.test/latest',
        'services.navasan.usd_rate_key'  => 'usd',
        'services.navasan.min_sane_rate' => 10_000,
        'services.navasan.max_sane_rate' => 500_000,
    ]);

    Http::fake([
        'api.navasan.test/*' => Http::response(['usd' => ['value' => '9999999']], 200), // above max
    ]);

    $admin = makeAdminWithExchangeRatePermission();

    $this->actingAs($admin)
        ->postJson('/api/v1/admin/exchange-rates/fetch-now')
        ->assertStatus(422);

    expect(ExchangeRate::where('source', 'manual_fetch')->exists())->toBeFalse();
});

it('fetchNow returns 422 when the external API call fails', function (): void {
    config([
        'services.navasan.api_key'  => 'fake-key',
        'services.navasan.base_url' => 'https://api.navasan.test/latest',
    ]);

    Http::fake([
        'api.navasan.test/*' => Http::response([], 503),
    ]);

    $admin = makeAdminWithExchangeRatePermission();

    $this->actingAs($admin)
        ->postJson('/api/v1/admin/exchange-rates/fetch-now')
        ->assertStatus(422);
});
