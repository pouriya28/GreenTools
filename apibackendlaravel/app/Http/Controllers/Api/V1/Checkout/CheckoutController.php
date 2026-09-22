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

        // آدرس‌های ذخیره‌شده فعلاً فقط برای کاربران واردشده پشتیبانی می‌شود؛
        // سبدهای مهمان (guest) فیلد user_id ندارند و به Address وصل نمی‌شوند.
        if ($cart->isGuest()) {
            throw new GuestCheckoutAddressNotSupportedException();
        }

        // مالکیت آدرس مستقیماً در کوئری چک می‌شود (IDOR guard)؛ اگر آدرس متعلق به
        // این کاربر نباشد، 404 برمی‌گردد نه اطلاعات یک آدرس دیگر.
        $address = Address::where('id', $request->validated('address_id'))
            ->where('user_id', $cart->user_id)
            ->firstOrFail();

        $order = $this->checkoutService->checkout(
            $cart,
            $address,
            $request->validated('shipping_method_id'),
        );

        return response()->json([
            'order_id' => $order->id,
            'status' => $order->status->value,
            'total_amount' => $order->total_amount,
            'shipping_cost' => $order->shipping_cost,
        ], 201);
    }
}