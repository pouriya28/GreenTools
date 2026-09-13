<?php
// app/Http/Controllers/Api/V1/Admin/OrderController.php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Order\UpdateOrderStatusRequest;
use App\Http\Resources\OrderListResource;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Shipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Order::class);

        $validated = $request->validate([
            'status' => ['nullable', 'string', Rule::in(array_column(OrderStatus::cases(), 'value'))],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $orders = Order::query()
            ->withCount('items')
            ->when($validated['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->latest('id')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json(OrderListResource::collection($orders)->response()->getData(true));
    }

    public function show(Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        $order->load(['items', 'payments', 'addressSnapshot', 'shipment']);

        return response()->json(['data' => new OrderResource($order)]);
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

        return response()->json(['data' => new OrderResource($order)]);
    }
}