<?php

use App\Enums\PriceProposalStatus;
use App\Models\ExchangeRate;
use App\Models\Product;
use App\Models\ProductPriceProposal;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAdminWithPricesReview(): User
{
    $admin = User::factory()->staff()->create();
    \Spatie\Permission\Models\Permission::firstOrCreate([
        'name'       => 'prices.review',
        'guard_name' => 'sanctum',
    ]);
    $admin->givePermissionTo('prices.review');
    return $admin;
}

function makeStaffNoReviewPermission(): User
{
    return User::factory()->staff()->create();
}

function makePricingRate(float $rate = 70_000): ExchangeRate
{
    return ExchangeRate::create([
        'rate'       => $rate,
        'status'     => 'pending_review',
        'fetched_at' => now(),
        'source'     => 'manual_admin',
    ]);
}

function makePricingProposal(ExchangeRate $rate, array $overrides = []): ProductPriceProposal
{
    $product = Product::factory()->create(['is_active' => true]);
    DB::table('products')->where('id', $product->id)->update(['price_toman' => 500_000, 'price_usd' => 10]);

    return ProductPriceProposal::create(array_merge([
        'batch_id'         => (string) Str::uuid(),
        'exchange_rate_id' => $rate->id,
        'product_id'       => $product->id,
        'old_price_toman'  => 500_000,
        'new_price_toman'  => 700_000,
        'status'           => PriceProposalStatus::PendingReview,
    ], $overrides));
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(function (): void {
    Http::preventStrayRequests();
    Mail::fake();
});

// ---------------------------------------------------------------------------
// index
// ---------------------------------------------------------------------------

it('index returns proposals for the specified batch', function (): void {
    $admin    = makeAdminWithPricesReview();
    $rate     = makePricingRate();
    $batchId  = (string) Str::uuid();

    makePricingProposal($rate, ['batch_id' => $batchId]);
    makePricingProposal($rate, ['batch_id' => $batchId]);

    $this->actingAs($admin)
        ->getJson("/api/v1/admin/prices/proposals?batch_id={$batchId}")
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('index returns empty collection when no proposals exist', function (): void {
    $admin = makeAdminWithPricesReview();

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/prices/proposals')
        ->assertOk();
});

it('index returns 403 for staff without prices.review permission', function (): void {
    $staff = makeStaffNoReviewPermission();

    $this->actingAs($staff)
        ->getJson('/api/v1/admin/prices/proposals')
        ->assertStatus(403);
});

it('index returns 401 for unauthenticated requests', function (): void {
    $this->getJson('/api/v1/admin/prices/proposals')
        ->assertStatus(401);
});

// ---------------------------------------------------------------------------
// update (edit proposed price)
// ---------------------------------------------------------------------------

it('update sets edited_price_toman and changes status to Edited', function (): void {
    $admin    = makeAdminWithPricesReview();
    $rate     = makePricingRate();
    $proposal = makePricingProposal($rate);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/prices/proposals/{$proposal->id}", [
            'edited_price_toman' => 650_000,
        ])
        ->assertOk();

    $fresh = $proposal->fresh();
    expect($fresh->edited_price_toman)->toBe(650_000)
        ->and($fresh->status)->toBe(PriceProposalStatus::Edited);
});

it('update returns 409 for an already-approved proposal', function (): void {
    $admin    = makeAdminWithPricesReview();
    $rate     = makePricingRate();
    $proposal = makePricingProposal($rate, ['status' => PriceProposalStatus::Approved]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/prices/proposals/{$proposal->id}", [
            'edited_price_toman' => 650_000,
        ])
        ->assertStatus(409);
});

// ---------------------------------------------------------------------------
// approve
// ---------------------------------------------------------------------------

it('approve marks proposal as Approved and updates product price', function (): void {
    $admin    = makeAdminWithPricesReview();
    $rate     = makePricingRate();
    $proposal = makePricingProposal($rate);
    $productId = $proposal->product_id;

    $this->actingAs($admin)
        ->postJson("/api/v1/admin/prices/proposals/{$proposal->id}/approve")
        ->assertOk();

    expect($proposal->fresh()->status)->toBe(PriceProposalStatus::Approved)
        ->and(Product::find($productId)->price_toman)->toBe(700_000);
});

it('approve returns 409 when proposal is already Approved', function (): void {
    $admin    = makeAdminWithPricesReview();
    $rate     = makePricingRate();
    $proposal = makePricingProposal($rate, ['status' => PriceProposalStatus::Approved]);

    $this->actingAs($admin)
        ->postJson("/api/v1/admin/prices/proposals/{$proposal->id}/approve")
        ->assertStatus(409);
});

it('approve returns 403 for staff without prices.review', function (): void {
    $staff    = makeStaffNoReviewPermission();
    $rate     = makePricingRate();
    $proposal = makePricingProposal($rate);

    $this->actingAs($staff)
        ->postJson("/api/v1/admin/prices/proposals/{$proposal->id}/approve")
        ->assertStatus(403);
});

// ---------------------------------------------------------------------------
// reject
// ---------------------------------------------------------------------------

it('reject marks proposal as Rejected', function (): void {
    $admin    = makeAdminWithPricesReview();
    $rate     = makePricingRate();
    $proposal = makePricingProposal($rate);

    $this->actingAs($admin)
        ->postJson("/api/v1/admin/prices/proposals/{$proposal->id}/reject")
        ->assertOk();

    expect($proposal->fresh()->status)->toBe(PriceProposalStatus::Rejected);
});

it('reject returns 409 when proposal is already Rejected', function (): void {
    $admin    = makeAdminWithPricesReview();
    $rate     = makePricingRate();
    $proposal = makePricingProposal($rate, ['status' => PriceProposalStatus::Rejected]);

    $this->actingAs($admin)
        ->postJson("/api/v1/admin/prices/proposals/{$proposal->id}/reject")
        ->assertStatus(409);
});

it('reject returns 403 for staff without prices.review', function (): void {
    $staff    = makeStaffNoReviewPermission();
    $rate     = makePricingRate();
    $proposal = makePricingProposal($rate);

    $this->actingAs($staff)
        ->postJson("/api/v1/admin/prices/proposals/{$proposal->id}/reject")
        ->assertStatus(403);
});

// ---------------------------------------------------------------------------
// REGRESSION: approve marks ExchangeRate as applied (via HTTP)
// ---------------------------------------------------------------------------

it('REGRESSION: approving a proposal via HTTP marks ExchangeRate status as applied', function (): void {
    $admin    = makeAdminWithPricesReview();
    $rate     = makePricingRate();
    $proposal = makePricingProposal($rate);

    $this->actingAs($admin)
        ->postJson("/api/v1/admin/prices/proposals/{$proposal->id}/approve")
        ->assertOk();

    expect($rate->fresh()->status)->toBe('applied');
});

it('REGRESSION: rejecting the last proposal in a batch marks ExchangeRate as rejected via HTTP', function (): void {
    $admin   = makeAdminWithPricesReview();
    $rate    = makePricingRate();
    $batchId = (string) Str::uuid();
    $proposal = makePricingProposal($rate, ['batch_id' => $batchId]);

    $this->actingAs($admin)
        ->postJson("/api/v1/admin/prices/proposals/{$proposal->id}/reject")
        ->assertOk();

    expect($rate->fresh()->status)->toBe('rejected');
});

// ---------------------------------------------------------------------------
// approveBatch / rejectBatch
// ---------------------------------------------------------------------------

it('approveBatch approves all pending proposals in a batch', function (): void {
    $admin   = makeAdminWithPricesReview();
    $rate    = makePricingRate();
    $batchId = (string) Str::uuid();

    makePricingProposal($rate, ['batch_id' => $batchId]);
    makePricingProposal($rate, ['batch_id' => $batchId]);

    $this->actingAs($admin)
        ->postJson("/api/v1/admin/prices/proposals/batch/{$batchId}/approve")
        ->assertOk()
        ->assertJsonPath('message', fn ($msg) => str_contains($msg, '2'));

    expect(
        ProductPriceProposal::where('batch_id', $batchId)
            ->where('status', PriceProposalStatus::Approved)
            ->count()
    )->toBe(2);
});

it('rejectBatch rejects all pending proposals in a batch', function (): void {
    $admin   = makeAdminWithPricesReview();
    $rate    = makePricingRate();
    $batchId = (string) Str::uuid();

    makePricingProposal($rate, ['batch_id' => $batchId]);
    makePricingProposal($rate, ['batch_id' => $batchId]);

    $this->actingAs($admin)
        ->postJson("/api/v1/admin/prices/proposals/batch/{$batchId}/reject")
        ->assertOk();

    expect(
        ProductPriceProposal::where('batch_id', $batchId)
            ->where('status', PriceProposalStatus::Rejected)
            ->count()
    )->toBe(2);
});

it('approveBatch returns 403 for staff without prices.review', function (): void {
    $staff   = makeStaffNoReviewPermission();
    $batchId = (string) Str::uuid();

    $this->actingAs($staff)
        ->postJson("/api/v1/admin/prices/proposals/batch/{$batchId}/approve")
        ->assertStatus(403);
});
