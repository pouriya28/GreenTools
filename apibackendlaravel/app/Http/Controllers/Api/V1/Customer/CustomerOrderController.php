<?php
// app/Http/Controllers/Api/V1/Customer/CustomerOrderController.php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderListResource;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        // Scoped strictly to the authenticated user — never reads a user_id
        // from the request, so there is no IDOR surface on this endpoint.
        $orders = Order::query()
            ->where('user_id', $request->user()->id)
            ->withCount('items')
            ->latest('id')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json(OrderListResource::collection($orders)->response()->getData(true));
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        // Same 404-not-403 pattern already used by ValidateCartOwnership:
        // an order belonging to someone else must look identical to a
        // nonexistent order, so IDs can't be enumerated by response code.
        if ($order->user_id !== $request->user()->id) {
            abort(404);
        }

        $order->load(['items', 'payments', 'addressSnapshot', 'shipment']);

        return response()->json(['data' => new OrderResource($order)]);
    }
}