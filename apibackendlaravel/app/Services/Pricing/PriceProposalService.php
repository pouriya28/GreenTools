<?php

namespace App\Services\Pricing;

use App\Enums\PriceProposalStatus;
use App\Exceptions\Pricing\PriceProposalAlreadyReviewedException;
use App\Models\ExchangeRate;
use App\Models\Product;
use App\Models\ProductPriceProposal;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PriceProposalService
{
    public function __construct(private PricingService $pricingService) {}

    /**
     * برای همه‌ی محصولات دلاری (price_usd > 0) یک ProductPriceProposal
     * می‌سازد. این متد قیمت هیچ محصولی را تغییر نمی‌دهد - فقط پیشنهاد
     * pending_review ثبت می‌کند؛ اعمال واقعی فقط بعد از approve از طریق
     * approveOne/approveBatch اتفاق می‌افتد. هم چک هفتگی خودکار و هم
     * override دستی ادمین باید از همین متد استفاده کنند (یک مسیر واحد،
     * طبق تصمیم تایید‌شده).
     */
    public function createBatchForRate(ExchangeRate $rate): string
    {
        $batchId = (string) Str::uuid();

        Product::query()
            ->where('price_usd', '>', 0)
            ->chunkById(200, function ($products) use ($rate, $batchId) {
                DB::transaction(function () use ($products, $rate, $batchId) {
                    foreach ($products as $product) {
                        // طبق کامنت واقعی PricingService::convertUsdToToman، اون متد فقط
                        // برای ویرایش دستی price_usd خودِ محصوله، نه برای بازمحاسبه‌ی ناشی
                        // از تغییر نرخ ارز (چه هفتگی چه override دستی). این‌جا باید
                        // computeTomanPrice (با محافظت «قیمت خودکار پایین نیاد») استفاده شود.
                        $newPrice = $this->pricingService->computeTomanPrice($product, $rate);

                        ProductPriceProposal::create([
                            'batch_id' => $batchId,
                            'exchange_rate_id' => $rate->id,
                            'product_id' => $product->id,
                            'old_price_toman' => $product->price_toman,
                            'new_price_toman' => $newPrice,
                            'status' => PriceProposalStatus::PendingReview,
                        ]);
                    }
                });
            });

        return $batchId;
    }

    public function editProposedValue(ProductPriceProposal $proposal, int $newPriceToman, int $adminId): ProductPriceProposal
    {
        $this->guardNotFinal($proposal);

        $proposal->update([
            'edited_price_toman' => $newPriceToman,
            'status' => PriceProposalStatus::Edited,
        ]);

        return $proposal->fresh();
    }

    public function approveOne(ProductPriceProposal $proposal, int $adminId): ProductPriceProposal
    {
        $this->guardNotFinal($proposal);

        DB::transaction(function () use ($proposal, $adminId) {
            $product = $proposal->product;
            $effectivePrice = $proposal->edited_price_toman ?? $proposal->new_price_toman;

            // همون چک تخفیفی که ProductService::update قبل از هر تغییر قیمت
            // انجام می‌دهد - جلوگیری از اینکه تخفیف ثابت محصول بعد از اعمال
            // قیمت جدید، بزرگ‌تر از خود قیمت بشود.
            $this->pricingService->assertDiscountValid(
                $product->discount_type?->value,
                $product->discount_value,
                $effectivePrice
            );

            $product->update(['price_toman' => $effectivePrice]);

            // Bug fix: nothing previously transitioned ExchangeRate::status to
            // 'applied' after a proposal was approved, so ExchangeRate::applied()
            // (used by RefreshExchangeRateJob to find the last applied rate for
            // anomaly-percent comparisons) always returned null. Approving a
            // proposal is exactly the moment this rate takes effect, so mark it
            // applied here. Guarded so re-approving other proposals in the same
            // batch does not re-fire the update.
            if ($proposal->exchangeRate->status !== 'applied') {
                $proposal->exchangeRate->update(['status' => 'applied']);
            }

            $proposal->update([
                'status' => PriceProposalStatus::Approved,
                'reviewed_by' => $adminId,
                'reviewed_at' => now(),
            ]);
        });

        return $proposal->fresh();
    }

    public function rejectOne(ProductPriceProposal $proposal, int $adminId): ProductPriceProposal
    {
        $this->guardNotFinal($proposal);

        DB::transaction(function () use ($proposal, $adminId) {
            $proposal->update([
                'status' => PriceProposalStatus::Rejected,
                'reviewed_by' => $adminId,
                'reviewed_at' => now(),
            ]);

            $this->markRateRejectedIfBatchFullyRejected($proposal->exchangeRate, $proposal->batch_id);
        });

        return $proposal->fresh();
    }

    public function approveBatch(string $batchId, int $adminId): int
    {
        return $this->reviewBatch($batchId, $adminId, approve: true);
    }

    public function rejectBatch(string $batchId, int $adminId): int
    {
        return $this->reviewBatch($batchId, $adminId, approve: false);
    }

    private function reviewBatch(string $batchId, int $adminId, bool $approve): int
    {
        $count = 0;

        ProductPriceProposal::query()
            ->where('batch_id', $batchId)
            ->whereIn('status', [PriceProposalStatus::PendingReview, PriceProposalStatus::Edited])
            ->chunkById(200, function ($proposals) use ($adminId, $approve, &$count) {
                foreach ($proposals as $proposal) {
                    $approve ? $this->approveOne($proposal, $adminId) : $this->rejectOne($proposal, $adminId);
                    $count++;
                }
            });

        return $count;
    }

    /**
     * Bug fix: previously nothing ever set ExchangeRate::status to
     * 'rejected', so a rate whose entire proposal batch was rejected stayed
     * 'pending_review' forever. ExchangeRateOverrideController::current()/
     * confirmCurrent() both just pick the latest-fetched rate, so that
     * already-rejected rate could later be silently reactivated by an admin
     * clicking "confirm current rate" for an unrelated reason (e.g. to add a
     * new dollar product). Once every proposal in this rate's batch has
     * reached a final state (approved or rejected) and none of them were
     * approved, the rate itself is now marked rejected so it stops being
     * treated as a valid "latest" candidate.
     *
     * If at least one proposal in the batch was approved, the rate is
     * already 'applied' (set in approveOne) and that takes precedence - a
     * rate that partially took effect should never be downgraded to
     * 'rejected'.
     */
    private function markRateRejectedIfBatchFullyRejected(ExchangeRate $rate, string $batchId): void
    {
        if ($rate->status === 'applied') {
            return;
        }

        $stillOpen = ProductPriceProposal::query()
            ->where('batch_id', $batchId)
            ->whereIn('status', [PriceProposalStatus::PendingReview, PriceProposalStatus::Edited])
            ->exists();

        if ($stillOpen) {
            return;
        }

        $hasApproved = ProductPriceProposal::query()
            ->where('batch_id', $batchId)
            ->where('status', PriceProposalStatus::Approved)
            ->exists();

        if (! $hasApproved && $rate->status !== 'rejected') {
            $rate->update(['status' => 'rejected']);
        }
    }

    private function guardNotFinal(ProductPriceProposal $proposal): void
    {
        if ($proposal->status->isFinal()) {
            throw PriceProposalAlreadyReviewedException::alreadyReviewed();
        }
    }
}
