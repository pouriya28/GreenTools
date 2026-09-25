<?php

use App\Enums\PriceProposalStatus;
use App\Exceptions\Pricing\PriceProposalAlreadyReviewedException;
use App\Models\ExchangeRate;
use App\Models\Product;
use App\Models\ProductPriceProposal;
use App\Models\User;
use App\Services\Pricing\PriceProposalService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUsdProduct(float $priceUsd, int $priceToman = 0): Product
{
    $product = Product::factory()->create(['is_active' => true]);
    DB::table('products')->where('id', $product->id)->update([
        'price_usd'   => $priceUsd,
        'price_toman' => $priceToman,
    ]);
    return $product->refresh();
}

function makeNonUsdProduct(): Product
{
    $product = Product::factory()->create(['is_active' => true]);
    DB::table('products')->where('id', $product->id)->update(['price_usd' => 0]);
    return $product->refresh();
}

function makePendingRate(float $rate = 70_000): ExchangeRate
{
    return ExchangeRate::create([
        'rate'       => $rate,
        'status'     => 'pending_review',
        'fetched_at' => now(),
        'source'     => 'manual_admin',
    ]);
}

function makeProposal(ExchangeRate $rate, Product $product, array $overrides = []): ProductPriceProposal
{
    return ProductPriceProposal::create(array_merge([
        'batch_id'         => (string) Str::uuid(),
        'exchange_rate_id' => $rate->id,
        'product_id'       => $product->id,
        'old_price_toman'  => $product->price_toman,
        'new_price_toman'  => 800_000,
        'status'           => PriceProposalStatus::PendingReview,
    ], $overrides));
}

function makeAdmin(): User
{
    return User::factory()->staff()->create();
}

// ---------------------------------------------------------------------------
// createBatchForRate
// ---------------------------------------------------------------------------

it('createBatchForRate creates proposals only for products with price_usd > 0', function (): void {
    $rate       = makePendingRate(80_000);
    $usdProduct = makeUsdProduct(priceUsd: 10.0, priceToman: 0);
    makeNonUsdProduct(); // should be skipped

    app(PriceProposalService::class)->createBatchForRate($rate);

    expect(ProductPriceProposal::where('exchange_rate_id', $rate->id)->count())->toBe(1)
        ->and(ProductPriceProposal::where('exchange_rate_id', $rate->id)->first()->product_id)
        ->toBe($usdProduct->id);
});

it('createBatchForRate applies price-floor protection (new price never lower than current)', function (): void {
    // current toman = 900_000, computed = 10 * 70_000 = 700_000 → stays 900_000
    $rate    = makePendingRate(70_000);
    $product = makeUsdProduct(priceUsd: 10.0, priceToman: 900_000);

    app(PriceProposalService::class)->createBatchForRate($rate);

    $proposal = ProductPriceProposal::where('exchange_rate_id', $rate->id)->first();
    expect($proposal->new_price_toman)->toBe(900_000);
});

it('createBatchForRate uses computed price when it is higher than current', function (): void {
    // current toman = 500_000, computed = 10 * 80_000 = 800_000 → 800_000
    $rate    = makePendingRate(80_000);
    $product = makeUsdProduct(priceUsd: 10.0, priceToman: 500_000);

    app(PriceProposalService::class)->createBatchForRate($rate);

    $proposal = ProductPriceProposal::where('exchange_rate_id', $rate->id)->first();
    expect($proposal->new_price_toman)->toBe(800_000);
});

it('createBatchForRate returns the same batch_id for all proposals in the run', function (): void {
    $rate = makePendingRate();
    makeUsdProduct(10.0);
    makeUsdProduct(20.0);
    makeUsdProduct(30.0);

    $batchId = app(PriceProposalService::class)->createBatchForRate($rate);

    $allSameBatch = ProductPriceProposal::where('exchange_rate_id', $rate->id)
        ->where('batch_id', $batchId)
        ->count() === 3;

    expect($allSameBatch)->toBeTrue();
});

it('createBatchForRate creates proposals with PendingReview status', function (): void {
    $rate = makePendingRate();
    makeUsdProduct(10.0);

    app(PriceProposalService::class)->createBatchForRate($rate);

    $proposal = ProductPriceProposal::where('exchange_rate_id', $rate->id)->first();
    expect($proposal->status)->toBe(PriceProposalStatus::PendingReview);
});

// ---------------------------------------------------------------------------
// approveOne — price update + rate status regression
// ---------------------------------------------------------------------------

it('approveOne updates product price_toman to the proposed price', function (): void {
    $rate     = makePendingRate();
    $product  = makeUsdProduct(10.0, 500_000);
    $admin    = makeAdmin();
    $proposal = makeProposal($rate, $product, ['new_price_toman' => 800_000]);

    app(PriceProposalService::class)->approveOne($proposal, $admin->id);

    expect($product->refresh()->price_toman)->toBe(800_000);
});

it('approveOne uses edited_price_toman when an admin has manually adjusted the proposed value', function (): void {
    $rate     = makePendingRate();
    $product  = makeUsdProduct(10.0, 500_000);
    $admin    = makeAdmin();
    $proposal = makeProposal($rate, $product, [
        'new_price_toman'    => 800_000,
        'edited_price_toman' => 750_000,
        'status'             => PriceProposalStatus::Edited,
    ]);

    app(PriceProposalService::class)->approveOne($proposal, $admin->id);

    expect($product->refresh()->price_toman)->toBe(750_000);
});

it('approveOne marks proposal status as Approved', function (): void {
    $rate     = makePendingRate();
    $product  = makeUsdProduct(10.0, 500_000);
    $admin    = makeAdmin();
    $proposal = makeProposal($rate, $product);

    app(PriceProposalService::class)->approveOne($proposal, $admin->id);

    expect($proposal->fresh()->status)->toBe(PriceProposalStatus::Approved);
});

it('approveOne sets reviewed_by and reviewed_at on the proposal', function (): void {
    $rate     = makePendingRate();
    $product  = makeUsdProduct(10.0, 500_000);
    $admin    = makeAdmin();
    $proposal = makeProposal($rate, $product);

    app(PriceProposalService::class)->approveOne($proposal, $admin->id);

    $fresh = $proposal->fresh();
    expect($fresh->reviewed_by)->toBe($admin->id)
        ->and($fresh->reviewed_at)->not->toBeNull();
});

it('REGRESSION: approveOne marks the ExchangeRate status as applied', function (): void {
    // Bug: before the fix, nothing ever transitioned ExchangeRate::status
    // to 'applied'. ExchangeRate::applied() scope always returned null,
    // breaking anomaly-percent comparisons in RefreshExchangeRateJob.
    $rate     = makePendingRate();
    $product  = makeUsdProduct(10.0, 500_000);
    $admin    = makeAdmin();
    $proposal = makeProposal($rate, $product);

    app(PriceProposalService::class)->approveOne($proposal, $admin->id);

    expect($rate->fresh()->status)->toBe('applied');
});

it('approveOne does not downgrade an already-applied rate', function (): void {
    $rate = ExchangeRate::create([
        'rate'       => 70_000,
        'status'     => 'applied',
        'fetched_at' => now(),
        'source'     => 'manual_admin',
    ]);
    $product  = makeUsdProduct(10.0, 500_000);
    $admin    = makeAdmin();
    $proposal = makeProposal($rate, $product);

    app(PriceProposalService::class)->approveOne($proposal, $admin->id);

    expect($rate->fresh()->status)->toBe('applied');
});

it('approveOne throws PriceProposalAlreadyReviewedException for an already-approved proposal', function (): void {
    $rate     = makePendingRate();
    $product  = makeUsdProduct(10.0, 500_000);
    $admin    = makeAdmin();
    $proposal = makeProposal($rate, $product, ['status' => PriceProposalStatus::Approved]);

    expect(fn () => app(PriceProposalService::class)->approveOne($proposal, $admin->id))
        ->toThrow(PriceProposalAlreadyReviewedException::class);
});

// ---------------------------------------------------------------------------
// rejectOne — rate status regression
// ---------------------------------------------------------------------------

it('rejectOne marks proposal status as Rejected', function (): void {
    $rate     = makePendingRate();
    $product  = makeUsdProduct(10.0, 500_000);
    $admin    = makeAdmin();
    $proposal = makeProposal($rate, $product);

    app(PriceProposalService::class)->rejectOne($proposal, $admin->id);

    expect($proposal->fresh()->status)->toBe(PriceProposalStatus::Rejected);
});

it('REGRESSION: rejectOne marks ExchangeRate as rejected when the entire batch is rejected', function (): void {
    // Bug: before the fix, a fully-rejected batch left the rate in
    // 'pending_review' forever. A later admin could accidentally reactivate
    // it via confirmCurrent(), restoring a rate the team had explicitly rejected.
    $rate     = makePendingRate();
    $product  = makeUsdProduct(10.0, 500_000);
    $admin    = makeAdmin();
    $proposal = makeProposal($rate, $product);

    app(PriceProposalService::class)->rejectOne($proposal, $admin->id);

    expect($rate->fresh()->status)->toBe('rejected');
});

it('rejectOne does NOT mark rate rejected when other proposals in the batch are still pending', function (): void {
    $batchId  = (string) Str::uuid();
    $rate     = makePendingRate();
    $product1 = makeUsdProduct(10.0, 500_000);
    $product2 = makeUsdProduct(20.0, 1_000_000);
    $admin    = makeAdmin();

    $proposal1 = makeProposal($rate, $product1, ['batch_id' => $batchId]);
    makeProposal($rate, $product2, ['batch_id' => $batchId]); // still pending

    app(PriceProposalService::class)->rejectOne($proposal1, $admin->id);

    expect($rate->fresh()->status)->toBe('pending_review');
});

it('rejectOne does NOT mark rate rejected when at least one proposal in the batch was approved', function (): void {
    $batchId  = (string) Str::uuid();
    $rate     = makePendingRate();
    $product1 = makeUsdProduct(10.0, 500_000);
    $product2 = makeUsdProduct(20.0, 1_000_000);
    $admin    = makeAdmin();

    makeProposal($rate, $product1, ['batch_id' => $batchId, 'status' => PriceProposalStatus::Approved]);
    $proposal2 = makeProposal($rate, $product2, ['batch_id' => $batchId]);

    // Manually mark rate as applied (as approveOne would have done)
    $rate->update(['status' => 'applied']);

    app(PriceProposalService::class)->rejectOne($proposal2, $admin->id);

    expect($rate->fresh()->status)->toBe('applied');
});

it('rejectOne throws PriceProposalAlreadyReviewedException for an already-rejected proposal', function (): void {
    $rate     = makePendingRate();
    $product  = makeUsdProduct(10.0, 500_000);
    $admin    = makeAdmin();
    $proposal = makeProposal($rate, $product, ['status' => PriceProposalStatus::Rejected]);

    expect(fn () => app(PriceProposalService::class)->rejectOne($proposal, $admin->id))
        ->toThrow(PriceProposalAlreadyReviewedException::class);
});

// ---------------------------------------------------------------------------
// editProposedValue
// ---------------------------------------------------------------------------

it('editProposedValue sets edited_price_toman and changes status to Edited', function (): void {
    $rate     = makePendingRate();
    $product  = makeUsdProduct(10.0, 500_000);
    $admin    = makeAdmin();
    $proposal = makeProposal($rate, $product);

    app(PriceProposalService::class)->editProposedValue($proposal, 720_000, $admin->id);

    $fresh = $proposal->fresh();
    expect($fresh->edited_price_toman)->toBe(720_000)
        ->and($fresh->status)->toBe(PriceProposalStatus::Edited);
});

it('editProposedValue throws PriceProposalAlreadyReviewedException for a final proposal', function (): void {
    $rate     = makePendingRate();
    $product  = makeUsdProduct(10.0, 500_000);
    $admin    = makeAdmin();
    $proposal = makeProposal($rate, $product, ['status' => PriceProposalStatus::Approved]);

    expect(fn () => app(PriceProposalService::class)->editProposedValue($proposal, 720_000, $admin->id))
        ->toThrow(PriceProposalAlreadyReviewedException::class);
});

// ---------------------------------------------------------------------------
// approveBatch / rejectBatch
// ---------------------------------------------------------------------------

it('approveBatch approves all pending proposals in the batch', function (): void {
    $batchId = (string) Str::uuid();
    $rate    = makePendingRate();
    $admin   = makeAdmin();

    makeProposal($rate, makeUsdProduct(10.0), ['batch_id' => $batchId]);
    makeProposal($rate, makeUsdProduct(20.0), ['batch_id' => $batchId]);

    $count = app(PriceProposalService::class)->approveBatch($batchId, $admin->id);

    expect($count)->toBe(2)
        ->and(
            ProductPriceProposal::where('batch_id', $batchId)
                ->where('status', PriceProposalStatus::Approved)
                ->count()
        )->toBe(2);
});

it('rejectBatch rejects all pending proposals in the batch', function (): void {
    $batchId = (string) Str::uuid();
    $rate    = makePendingRate();
    $admin   = makeAdmin();

    makeProposal($rate, makeUsdProduct(10.0), ['batch_id' => $batchId]);
    makeProposal($rate, makeUsdProduct(20.0), ['batch_id' => $batchId]);

    $count = app(PriceProposalService::class)->rejectBatch($batchId, $admin->id);

    expect($count)->toBe(2)
        ->and(
            ProductPriceProposal::where('batch_id', $batchId)
                ->where('status', PriceProposalStatus::Rejected)
                ->count()
        )->toBe(2);
});

it('approveBatch skips already-final proposals', function (): void {
    $batchId = (string) Str::uuid();
    $rate    = makePendingRate();
    $admin   = makeAdmin();

    $product1 = makeUsdProduct(10.0);
    $product2 = makeUsdProduct(20.0);

    makeProposal($rate, $product1, ['batch_id' => $batchId]); // pending
    makeProposal($rate, $product2, ['batch_id' => $batchId, 'status' => PriceProposalStatus::Approved]); // already final

    $count = app(PriceProposalService::class)->approveBatch($batchId, $admin->id);

    expect($count)->toBe(1); // only the pending one was processed
});
