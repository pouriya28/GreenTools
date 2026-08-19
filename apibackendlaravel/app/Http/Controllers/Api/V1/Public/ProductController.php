<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\DTOs\Product\ProductFilterDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Product\ProductIndexRequest;
use App\Http\Resources\ProductListResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\Product\ProductFilterService;
use App\Services\Product\ProductService;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private ProductFilterService $filterService,
        private ProductService $productService,
    ) {}

    public function index(ProductIndexRequest $request)
    {
        $filters = ProductFilterDTO::fromArray($request->validated());
        $products = $this->filterService->paginate($filters);

        return ProductListResource::collection($products);
    }


    public function featured(Request $request)
    {
        $filters = ProductFilterDTO::fromArray([
            'is_featured' => true,
            'sort' => 'newest',
            'per_page' => $request->query('per_page', 12),
            'page' => $request->query('page', 1),
        ]);

        $products = $this->filterService->paginate($filters);

        return ProductListResource::collection($products);
    }

    /**
     * صفحه‌ی جزئیات محصول عمومی. این متد قبلاً وجود نداشت با اینکه در
     * routes/api/v1/products.php روی 'GET {slug}' رجیستر شده بود؛ یعنی هر
     * درخواست به این مسیر با BadMethodCallException (خطای ۵۰۰) مواجه می‌شد
     * و صفحه‌ی محصول در فرانت هرگز کار نمی‌کرد. فقط محصولات فعال (active
     * scope) در دسترس عمومی‌اند؛ غیرفعال/سافت‌دیلیت‌شده باید ۴۰۴ بدهند.
     */
    public function show(string $slug)
    {
        $product = Product::query()
            ->active()
            ->with(['category', 'images', 'videos'])
            ->where('slug', $slug)
            ->firstOrFail();

        $this->productService->incrementViews($product);

        return new ProductResource($product);
    }
}
