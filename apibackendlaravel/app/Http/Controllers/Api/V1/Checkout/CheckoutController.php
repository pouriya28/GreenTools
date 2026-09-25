<?php

namespace App\Http\Controllers\Api\V1\Checkout;

use App\Exceptions\Checkout\GuestCheckoutAddressNotSupportedException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Checkout\StoreCheckoutRequest;
use App\Models\Address;
use App\Models\Cart;
use App\Services\Checkout\CheckoutService;
use Illuminate\Http\JsonResponse;

class CheckoutController extends Controller
{
    public function __construct(private readonly CheckoutService $checkoutService)
    {
    }

    public function store(StoreCheckoutRequest $request): JsonResponse
    {
        /** @var Cart $cart */
        $cart = $request->attributes->get('current_cart');

        // Saved addresses are only supported for authenticated users;
        // guest carts have no user_id and cannot be linked to an Address.
        if ($cart->isGuest()) {
            throw new GuestCheckoutAddressNotSupportedException();
        }

        // Ownership is checked directly in the query (IDOR guard); if the
        // address does not belong to this user, 404 is returned instead of
        // leaking another user's address data.
        $address = Address::where('id', $request->validated('address_id'))
            ->where('user_id', $cart->user_id)
            ->firstOrFail();

        $result = $this->checkoutService->checkout(
            $cart,
            $address,
            $request->validated('shipping_method_id'),
            $request->validated('gateway'),
        );

        return response()->json([
            'order_id'      => $result->order->id,
            'status'        => $result->order->status->value,
            'total_amount'  => $result->order->total_amount,
            'shipping_cost' => $result->order->shipping_cost,
            'payment_url'   => $result->paymentIntentUrl,
        ], 201);
    }
}
