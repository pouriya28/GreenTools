<?php
// app/Http/Controllers/Api/V1/Admin/OrderController.php

namespace App\Http\Controllers\Api\V1\Admin;

use App\DTOs\Order\OrderFilterDTO;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Order\AdminOrderIndexRequest;
use App\Http\Requests\Api\V1\Order\UpdateOrderStatusRequest;
use App\Http\Resources\OrderListResource;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Shipment;
use App\Services\Order\OrderFilterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Http\Responses\ApiResponse;
class OrderController extends Controller
{
    public function __construct(private readonly OrderFilterService $orderFilterService)
    {
    }
    public function index(AdminOrderIndexRequest $request): JsonResponse
    {
        // authorize('viewAny') از قبل داخل AdminOrderIndexRequest::authorize() چک شده
        // (همون الگوی AdminProductIndexRequest)؛ اینجا نیازی به تکرارش نیست.
        $filters = OrderFilterDTO::fromArray($request->validated());

        $orders = $this->orderFilterService->paginate($filters);

            return ApiResponse::success(
        OrderListResource::collection($orders)->response()->getData(true),
    );
    }

    public function show(Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        $order->load(['items', 'payments', 'addressSnapshot', 'shipment']);

        return ApiResponse::success(new OrderResource($order));
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $this->authorize('updateStatus', $order);

        $nextStatus = OrderStatus::from($request->validated('status'));

        DB::transaction(function () use ($request, $order, $nextStatus) {
            // The state machine itself (OrderStatus::canTransitionTo) is the
            // only gate on legality — this controller never writes status
            // directly and throws InvalidOrderTransitionException (409) on
            // any illegal jump.
            $order->transitionTo($nextStatus);

            if ($nextStatus === OrderStatus::Shipped) {
                Shipment::updateOrCreate(
                    ['order_id' => $order->id],
                    [
                        'status' => 'shipped',
                        'tracking_code' => $request->validated('tracking_code'),
                        'shipped_at' => now(),
                    ],
                );
            }

            if ($nextStatus === OrderStatus::Delivered) {
                Shipment::where('order_id', $order->id)->update([
                    'status' => 'delivered',
                    'delivered_at' => now(),
                ]);
            }
        });

        $order->refresh()->load(['items', 'payments', 'addressSnapshot', 'shipment']);

        return ApiResponse::success(new OrderResource($order));
    }
}