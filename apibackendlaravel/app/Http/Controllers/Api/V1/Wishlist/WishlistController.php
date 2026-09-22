<?php
// app/Http/Controllers/Api/V1/Wishlist/WishlistController.php

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
        $products = $this->wishlistService->paginateProductsForUser($request->user());

        // از همان ProductListResource موجود استفاده می‌کنیم تا شکل داده دقیقاً
        // با چیزی که ProductCard فرانت از قبل مصرف می‌کند یکسان بماند.
        return ApiResponse::success(
            ProductListResource::collection($products)->response()->getData(true)
        );
    }

    // برای این‌که قلب روی هر ProductCard بدون گرفتن کل محصول بداند پرشده/خالیه.
    public function productIds(Request $request): JsonResponse
    {
        return ApiResponse::success([
            'product_ids' => $this->wishlistService->productIdsForUser($request->user()),
        ]);
    }

    public function store(StoreWishlistRequest $request): JsonResponse
    {
        $product = Product::query()->findOrFail($request->validated('product_id'));

        $this->wishlistService->add($request->user(), $product);

        return ApiResponse::success(null, 'به علاقه‌مندی‌ها اضافه شد.', status: 201);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $this->wishlistService->remove($request->user(), $product);

        return ApiResponse::success(null, 'از علاقه‌مندی‌ها حذف شد.');
    }
}