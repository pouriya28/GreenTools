<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\GenerateShippingLabelsRequest;
use App\Http\Responses\ApiResponse;
use App\Models\SenderAddress;
use App\Services\ShippingLabelDataService;
use Illuminate\Http\JsonResponse;

class ShippingLabelController extends Controller
{
    public function __construct(private readonly ShippingLabelDataService $labelDataService)
    {
    }

    public function generate(GenerateShippingLabelsRequest $request): JsonResponse
    {
        $sender = SenderAddress::findOrFail($request->validated('sender_address_id'));

        $sheet = $this->labelDataService->build(
            orderIds: $request->validated('order_ids', []),
            status: $request->validated('status'),
            sender: $sender,
            paperSize: $request->validated('paper_size'),
            labelSize: $request->validated('label_size'),
            copiesPerOrder: $request->validated('copies_per_order', 1),
        );

        return ApiResponse::success($sheet);
    }
}