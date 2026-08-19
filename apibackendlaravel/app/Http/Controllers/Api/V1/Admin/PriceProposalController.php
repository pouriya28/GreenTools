<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Exceptions\Pricing\PriceProposalAlreadyReviewedException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Pricing\UpdatePriceProposalRequest;
use App\Http\Resources\ProductPriceProposalResource;
use App\Models\ProductPriceProposal;
use App\Services\Pricing\PriceProposalCsvExporter;
use App\Services\Pricing\PriceProposalService;
use Illuminate\Http\Request;

class PriceProposalController extends Controller
{
    public function __construct(
        private PriceProposalService $proposalService,
        private PriceProposalCsvExporter $csvExporter,
    ) {}

    /**
     * لیست پیشنهادهای قیمت. اگر batch_id داده نشود، آخرین batch (جدیدترین
     * اجرا - چک خودکار یا override دستی) به‌صورت پیش‌فرض نمایش داده می‌شود.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', ProductPriceProposal::class);

        $batchId = $request->query('batch_id') ?? ProductPriceProposal::query()->latest('id')->value('batch_id');

        if (! $batchId) {
            return ProductPriceProposalResource::collection(collect());
        }

        $proposals = ProductPriceProposal::query()
            ->where('batch_id', $batchId)
            ->with('product:id,name,sku')
            ->orderBy('id')
            ->paginate(min((int) $request->query('per_page', 50), 200));

        return ProductPriceProposalResource::collection($proposals);
    }

    /** خروجی CSV فقط-خواندنی برای یک batch - هرگز ذخیره نمی‌شود، فقط تولید و پاسخ داده می‌شود. */
    public function exportCsv(string $batchId)
    {
        $this->authorize('viewAny', ProductPriceProposal::class);

        $csv = $this->csvExporter->exportForBatch($batchId);

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=price-proposals-{$batchId}.csv",
        ]);
    }

    public function update(UpdatePriceProposalRequest $request, ProductPriceProposal $proposal)
    {
        $this->guardNotFinal($proposal);

        $proposal = $this->proposalService->editProposedValue(
            $proposal,
            (int) $request->validated('edited_price_toman'),
            $request->user()->id
        );

        return new ProductPriceProposalResource($proposal);
    }

    public function approve(Request $request, ProductPriceProposal $proposal)
    {
        $this->authorize('review', ProductPriceProposal::class);
        $this->guardNotFinal($proposal);

        $proposal = $this->proposalService->approveOne($proposal, $request->user()->id);

        return new ProductPriceProposalResource($proposal);
    }

    public function reject(Request $request, ProductPriceProposal $proposal)
    {
        $this->authorize('review', ProductPriceProposal::class);
        $this->guardNotFinal($proposal);

        $proposal = $this->proposalService->rejectOne($proposal, $request->user()->id);

        return new ProductPriceProposalResource($proposal);
    }

    public function approveBatch(Request $request, string $batchId)
    {
        $this->authorize('review', ProductPriceProposal::class);

        $count = $this->proposalService->approveBatch($batchId, $request->user()->id);

        return response()->json(['message' => "تعداد {$count} پیشنهاد قیمت تایید شد."]);
    }

    public function rejectBatch(Request $request, string $batchId)
    {
        $this->authorize('review', ProductPriceProposal::class);

        $count = $this->proposalService->rejectBatch($batchId, $request->user()->id);

        return response()->json(['message' => "تعداد {$count} پیشنهاد قیمت رد شد."]);
    }

    private function guardNotFinal(ProductPriceProposal $proposal): void
    {
        if ($proposal->status->isFinal()) {
            throw PriceProposalAlreadyReviewedException::alreadyReviewed();
        }
    }
}
