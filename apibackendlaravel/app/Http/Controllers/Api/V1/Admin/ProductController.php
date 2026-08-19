<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Product\AdminProductIndexRequest;
use App\Http\Requests\Api\V1\Product\StoreProductRequest;
use App\Http\Requests\Api\V1\Product\UpdateProductRequest;
use App\Http\Resources\ProductListResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\Product\ProductService;
use Illuminate\Database\Eloquent\Builder;

class ProductController extends Controller
{
    public function __construct(private ProductService $productService) {}

    /**
     * لیست مدیریتی محصولات، صفحه‌بندی‌شده. برخلاف ProductFilterService
     * عمومی، اینجا ->active() اجباری نیست چون ادمین باید محصولات غیرفعال
     * رو هم ببینه.
     */
    public function index(AdminProductIndexRequest $request)
    {
        $filters = $request->validated();
        $perPage = min((int) ($filters['per_page'] ?? 20), 50);

        $products = Product::query()
            ->with(['category:id,name,slug', 'primaryImage'])
            ->when($filters['search'] ?? null, function (Builder $query, string $search) {
                $escaped = $this->escapeLike($search);
                $query->where(function (Builder $q) use ($escaped) {
                    $q->where('name', 'like', "%{$escaped}%")
                        ->orWhere('sku', 'like', "%{$escaped}%");
                });
            })
            ->when($filters['category_id'] ?? null, fn (Builder $query, int $categoryId) => $query->where('category_id', $categoryId))
            ->when(array_key_exists('is_active', $filters), fn (Builder $query) => $query->where('is_active', $filters['is_active']))
            ->when($filters['stock_status'] ?? null, fn (Builder $query, string $status) => $query->where('stock_status', $status))
            ->when(($filters['sort'] ?? null) === 'oldest', fn (Builder $query) => $query->oldest())
            // ستون 'price' با مایگریشن add_usd_pricing_to_products_table به
            // 'price_toman' تغییر نام پیدا کرد؛ مرتب‌سازی قبلاً هنوز به ستون
            // قدیمی اشاره می‌کرد و باعث خطای SQL (500) در لیست ادمین می‌شد.
            ->when(($filters['sort'] ?? null) === 'price_asc', fn (Builder $query) => $query->orderBy('price_toman', 'asc'))
            ->when(($filters['sort'] ?? null) === 'price_desc', fn (Builder $query) => $query->orderBy('price_toman', 'desc'))
            ->when(!isset($filters['sort']) || $filters['sort'] === 'newest', fn (Builder $query) => $query->latest())
            ->paginate($perPage, ['*'], 'page', $filters['page'] ?? 1)
            ->withQueryString();

        return ProductListResource::collection($products);
    }

    public function show(Product $product)
    {
        $this->authorize('view', Product::class);

        return new ProductResource($product->load(['category', 'images', 'videos']));
    }

    public function store(StoreProductRequest $request)
    {
        $product = $this->productService->create($request->validated(), $request->user()->id);

        return (new ProductResource($product))->response()->setStatusCode(201);
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        $product = $this->productService->update($product, $request->validated(), $request->user()->id);

        return new ProductResource($product->load(['category', 'images', 'videos']));
    }

    public function destroy(Product $product)
    {
        $this->authorize('manage', Product::class);

        $this->productService->delete($product);

        return response()->json(['message' => 'محصول با موفقیت حذف شد.']);
    }

    public function toggleFeatured(Product $product)
    {
        $this->authorize('manage', Product::class);

        $product = $this->productService->toggleFeatured($product);

        return new ProductResource($product);
    }

    /** لیست محصولات سافت‌دیلیت‌شده (سطل‌زباله)، صفحه‌بندی‌شده. */
    public function trash()
    {
        $this->authorize('viewTrash', Product::class);

        $products = Product::onlyTrashed()
            ->with(['category:id,name,slug', 'primaryImage'])
            ->orderByDesc('deleted_at')
            ->paginate(20);

        return ProductListResource::collection($products);
    }

    /**
     * بازگردانی یه محصول از سطل‌زباله. عمداً route-model-binding معمولی
     * استفاده نمی‌کنیم چون اون فقط رکوردهای زنده رو می‌بینه.
     */
    public function restore(int $id)
    {
        $this->authorize('restore', Product::class);

        $product = Product::onlyTrashed()->findOrFail($id);
        $product = $this->productService->restore($product);

        return new ProductResource($product);
    }

    /** حذف قطعی و برگشت‌ناپذیر از سطل‌زباله، شامل پاک‌سازی فایل‌های دیسک. */
    public function forceDestroy(int $id)
    {
        $this->authorize('forceDelete', Product::class);

        $product = Product::onlyTrashed()->findOrFail($id);
        $this->productService->forceDelete($product);

        return response()->json(['message' => 'محصول برای همیشه حذف شد.']);
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }
}
