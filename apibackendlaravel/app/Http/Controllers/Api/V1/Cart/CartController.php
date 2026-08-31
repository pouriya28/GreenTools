<?php

namespace App\Http\Controllers\Api\V1\Cart;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Cart\AddCartItemRequest;
use App\Http\Requests\Api\V1\Cart\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Services\Cart\CartService;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private readonly CartService $cartService)
    {
    }

    public function show(Request $request): CartResource
    {
        $cart = $this->currentCart($request);
        $cart->load(['items.product.primaryImage']);

        return new CartResource($cart);
    }

    public function addItem(AddCartItemRequest $request): CartResource
    {
        $cart = $this->currentCart($request);

        $this->cartService->addItem(
            $cart,
            $request->integer('product_id'),
            $request->integer('quantity'),
            $request->boolean('purchase_confirmed'),
        );

        $cart->load(['items.product.primaryImage']);

        return new CartResource($cart);
    }

    public function updateItem(UpdateCartItemRequest $request, int $item): CartResource
    {
        $cart = $this->currentCart($request);

        $this->cartService->updateQuantity(
            $cart,
            $item,
            $request->integer('quantity'),
            $request->integer('version'),
        );

        $cart->load(['items.product.primaryImage']);

        return new CartResource($cart);
    }

    public function removeItem(Request $request, int $item): CartResource
    {
        $cart = $this->currentCart($request);

        $this->cartService->removeItem($cart, $item, (int) $request->query('version', $cart->version));

        $cart->load(['items.product.primaryImage']);

        return new CartResource($cart);
    }

    private function currentCart(Request $request): Cart
    {
        return $request->attributes->get('current_cart');
    }
}