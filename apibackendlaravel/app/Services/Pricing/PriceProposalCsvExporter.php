<?php

namespace App\Services\Pricing;

use App\Models\ProductPriceProposal;

class PriceProposalCsvExporter
{
    /**
     * CSV فقط خروجی است (read-only) - هرگز روی دیسک ذخیره نمی‌شود و هیچ
     * مسیر importی برایش وجود ندارد، طبق تصمیم تایید‌شده. همین متد هم برای
     * پیوست ایمیل و هم برای دانلود مستقیم از پنل ادمین استفاده می‌شود.
     */
    public function exportForBatch(string $batchId): string
    {
        $handle = fopen('php://temp', 'w+');
        fputcsv($handle, ['product_id', 'sku', 'name', 'old_price_toman', 'new_price_toman', 'effective_price_toman', 'status']);

        ProductPriceProposal::query()
            ->where('batch_id', $batchId)
            ->with('product:id,name,sku')
            ->orderBy('id')
            ->chunkById(500, function ($proposals) use ($handle) {
                foreach ($proposals as $proposal) {
                    fputcsv($handle, [
                        $proposal->product_id,
                        $proposal->product->sku ?? '',
                        $proposal->product->name ?? '',
                        $proposal->old_price_toman,
                        $proposal->new_price_toman,
                        $proposal->effective_price_toman,
                        $proposal->status->value,
                    ]);
                }
            });

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv;
    }
}
