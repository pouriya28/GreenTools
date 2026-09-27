<?php

namespace App\Http\Controllers\Api\V1\Wishlist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Wishlist\StoreWishlistRequest;
use App\Http\Resources\ProductListResource;
use App\Http\Responses\ApiResponse;
use App\Models\Product;
use App\Services\WishlistService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function __construct(private readonly WishlistService $wishlistService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user !== null) {
            $products = $this->wishlistService->paginateProductsForUser($user);
        } else {
            $guestToken = $request->attributes->get('wishlist_guest_token');
            $products   = $this->wishlistService->paginateProductsForGuest($guestToken);
        }

        return ApiResponse::success(
            ProductListResource::collection($products)->response()->getData(true)
        );
    }

    public function productIds(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user !== null) {
            $ids = $this->wishlistService->productIdsForUser($user);
        } else {
            $guestToken = $request->attributes->get('wishlist_guest_token');
            $ids        = $this->wishlistService->productIdsForGuest($guestToken);
        }

        return ApiResponse::success(['product_ids' => $ids]);
    }

    public function store(StoreWishlistRequest $request): JsonResponse
    {
        $product = Product::query()->findOrFail($request->validated('product_id'));
        $user    = $request->user();

        if ($user !== null) {
            $this->wishlistService->add($user, $product);
        } else {
            $guestToken = $request->attributes->get('wishlist_guest_token');
            $this->wishlistService->addForGuest($guestToken, $product);
        }

        return ApiResponse::success(null, 'به علاقه‌مندی‌ها اضافه شد.', status: 201);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $user = $request->user();

        if ($user !== null) {
            $this->wishlistService->remove($user, $product);
        } else {
            $guestToken = $request->attributes->get('wishlist_guest_token');
            $this->wishlistService->removeForGuest($guestToken, $product);
        }

        return ApiResponse::success(null, 'از علاقه‌مندی‌ها حذف شد.');
    }
}
