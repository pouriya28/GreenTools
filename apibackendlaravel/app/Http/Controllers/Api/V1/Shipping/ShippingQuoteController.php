<?php
// app/Http/Controllers/Api/V1/Shipping/ShippingQuoteController.php

namespace App\Http\Controllers\Api\V1\Shipping;

use App\Contracts\ShippingCalculatorInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Shipping\ShippingQuoteRequest;
use App\Http\Resources\ShippingQuoteResource;
use App\Models\Cart;
use App\Models\ShippingMethod;
use App\Services\Cart\CartService;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\Request;

class ShippingQuoteController extends Controller
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly ShippingCalculatorInterface $shippingCalculator,
    ) {
    }

    public function store(ShippingQuoteRequest $request): \Illuminate\Http\JsonResponse
    {
        /** @var Cart $cart */
        $cart = $request->attributes->get('current_cart');
        $shippingMethod = ShippingMethod::active()->findOrFail($request->integer('shipping_method_id'));

        $weightGrams = $shippingMethod->calculation_type === 'fixed'
            ? 0
            : $this->cartService->totalWeightGrams($cart);

        $subtotal = $this->cartService->subtotal($cart);
        $quote = $this->shippingCalculator->calculate($shippingMethod, $weightGrams, $subtotal);

        return ApiResponse::success(new ShippingQuoteResource($quote));
    }
}