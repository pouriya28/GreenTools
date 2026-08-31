<?php

namespace App\Http\Controllers\Api\V1\Checkout;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Services\Checkout\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function __construct(private readonly CheckoutService $checkoutService)
    {
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Cart $cart */
        $cart = $request->attributes->get('current_cart');

        $order = $this->checkoutService->checkout($cart);

        return response()->json([
            'order_id' => $order->id,
            'status' => $order->status->value,
            'total_amount' => $order->total_amount,
        ], 201);
    }
}