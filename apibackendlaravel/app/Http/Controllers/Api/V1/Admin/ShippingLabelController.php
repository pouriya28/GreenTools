<?php
// app/Http/Controllers/Api/V1/Admin/ShippingLabelController.php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\GenerateShippingLabelsRequest;
use App\Models\SenderAddress;
use App\Services\ShippingLabelPdfService;
use Illuminate\Http\Response;

class ShippingLabelController extends Controller
{
    public function __construct(private readonly ShippingLabelPdfService $pdfService)
    {
    }

    public function generate(GenerateShippingLabelsRequest $request): Response
    {
        $sender = SenderAddress::findOrFail($request->validated('sender_address_id'));

        $pdf = $this->pdfService->generate(
            orderIds: $request->validated('order_ids', []),
            status: $request->validated('status'),
            sender: $sender,
            paperSize: $request->validated('paper_size'),
            labelSize: $request->validated('label_size'),
            copiesPerOrder: $request->validated('copies_per_order', 1),
        );

        // inline یعنی مرورگر خودش PDF رو باز می‌کنه؛ همون پیش‌نمایش + چاپ WYSIWYG
        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="shipping-labels.pdf"',
        ]);
    }
}