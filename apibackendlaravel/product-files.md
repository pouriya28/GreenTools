# Product Related PHP Files


---

## `app\DTOs\Product\ProductFilterDTO.php`

```php
<?php

namespace App\DTOs\Product;

final class ProductFilterDTO
{
    public function __construct(
        public readonly ?string $categorySlug = null,
        public readonly ?string $search = null,
        public readonly ?int $minPrice = null,
        public readonly ?int $maxPrice = null,
        public readonly bool $inStock = false,
        public readonly bool $hasDiscount = false,
        public readonly bool $isFeatured = false,
        public readonly string $sort = 'newest',
        public readonly int $perPage = 20,
        public readonly int $page = 1,
    ) {}

    public static function fromArray(array $validated): self
    {
        return new self(
            categorySlug: $validated['category_slug'] ?? null,
            search: isset($validated['search']) ? trim($validated['search']) : null,
            minPrice: isset($validated['min_price']) ? (int) $validated['min_price'] : null,
            maxPrice: isset($validated['max_price']) ? (int) $validated['max_price'] : null,
            inStock: (bool) ($validated['in_stock'] ?? false),
            hasDiscount: (bool) ($validated['has_discount'] ?? false),
            isFeatured: (bool) ($validated['is_featured'] ?? false),
            sort: $validated['sort'] ?? 'newest',
            // دفاع دوم: حتی اگه یه‌جا FormRequest دور زده بشه (مثلاً فراخوانی داخلی سرویس)، اینجا هم کلمپ میشه
            perPage: min((int) ($validated['per_page'] ?? 20), 50),
            page: max((int) ($validated['page'] ?? 1), 1),
        );
    }
}
```


---

## `app\Exceptions\Product\ProductMediaNotFoundException.php`

```php
<?php

namespace App\Exceptions\Product;

use App\Exceptions\ApiException;

/**
 * وقتی عکس/ویدیوی ارسالی متعلق به محصول مسیر (route) نیست. عمداً ۴۰۴
 * برمی‌گردونیم (نه ۴۲۲/۴۰۳) تا با رفتار ProductMediaController::destroyImage/
 * destroyVideo که برای همین حالت abort(404) می‌زنه یکسان باشه.
 */
class ProductMediaNotFoundException extends ApiException
{
    private function __construct(
        private readonly string $code,
        private readonly string $userFacingMessage,
        string $debugMessage,
    ) {
        parent::__construct($debugMessage);
    }

    public static function imageNotOwnedByProduct(): self
    {
        return new self(
            'PRODUCT_IMAGE_NOT_FOUND',
            'این عکس متعلق به این محصول نیست.',
            'Image does not belong to the given product.',
        );
    }

    public static function videoNotOwnedByProduct(): self
    {
        return new self(
            'PRODUCT_VIDEO_NOT_FOUND',
            'این ویدیو متعلق به این محصول نیست.',
            'Video does not belong to the given product.',
        );
    }

    public function errorCode(): string
    {
        return $this->code;
    }

    public function statusCode(): int
    {
        return 404;
    }

    public function userMessage(): string
    {
        return $this->userFacingMessage;
    }
}
```


---

## `app\Exceptions\Product\ProductMediaValidationException.php`

```php
<?php

namespace App\Exceptions\Product;

use App\Exceptions\ApiException;

/**
 * خطاهای اعتبارسنجی رسانه‌ی محصول (عکس/ویدیو) - تعداد بیش از حد فایل، حجم
 * غیرمجاز یا فرمت نامعتبر. قبلاً این خطاها \RuntimeException خام پرتاب
 * می‌شدن و از مسیر استاندارد ApiException/ApiResponse رد نمی‌شدن؛ یعنی به‌جای
 * پاسخ ۴۲۲ ساختاریافته با پیام فارسی، فرانت یک خطای عمومی ۵۰۰ می‌گرفت.
 */
class ProductMediaValidationException extends ApiException
{
    private function __construct(
        private readonly string $code,
        private readonly string $userFacingMessage,
        string $debugMessage,
    ) {
        parent::__construct($debugMessage);
    }

    public static function tooManyImages(int $max): self
    {
        return new self(
            'PRODUCT_MEDIA_TOO_MANY_IMAGES',
            "حداکثر {$max} عکس در هر بار آپلود مجاز است.",
            'Too many images in a single upload.',
        );
    }

    public static function imageTooLarge(int $maxMb): self
    {
        return new self(
            'PRODUCT_MEDIA_IMAGE_TOO_LARGE',
            "حجم هر عکس نباید بیشتر از {$maxMb} مگابایت باشد.",
            'Uploaded image exceeds the size limit.',
        );
    }

    public static function invalidImage(): self
    {
        return new self(
            'PRODUCT_MEDIA_INVALID_IMAGE',
            'فایل ارسال‌شده یک تصویر معتبر با فرمت مجاز نیست.',
            'Uploaded file failed image content validation.',
        );
    }

    public static function tooManyVideos(int $max): self
    {
        return new self(
            'PRODUCT_MEDIA_TOO_MANY_VIDEOS',
            "حداکثر {$max} ویدیو برای هر محصول مجاز است.",
            'Too many videos for this product.',
        );
    }

    public static function videoFileMissing(): self
    {
        return new self(
            'PRODUCT_MEDIA_VIDEO_FILE_MISSING',
            'فایل ویدیو ارسال نشده است.',
            'Video upload was expected but no file was provided.',
        );
    }

    public static function videoTooLarge(int $maxMb): self
    {
        return new self(
            'PRODUCT_MEDIA_VIDEO_TOO_LARGE',
            "حجم ویدیو نباید بیشتر از {$maxMb} مگابایت باشد.",
            'Uploaded video exceeds the size limit.',
        );
    }

    public static function invalidVideo(): self
    {
        return new self(
            'PRODUCT_MEDIA_INVALID_VIDEO',
            'فرمت ویدیو پشتیبانی نمی‌شود.',
            'Uploaded file failed video mime validation.',
        );
    }

    public function errorCode(): string
    {
        return $this->code;
    }

    public function statusCode(): int
    {
        return 422;
    }

    public function userMessage(): string
    {
        return $this->userFacingMessage;
    }
}
```


---

## `app\Http\Controllers\Api\V1\Admin\PriceProposalController.php`

```php
<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Exceptions\Pricing\PriceProposalAlreadyReviewedException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Pricing\UpdatePriceProposalRequest;
use App\Http\Resources\ProductPriceProposalResource;
use App\Models\ProductPriceProposal;
use App\Services\Pricing\PriceProposalCsvExporter;
use App\Services\Pricing\PriceProposalService;
use Illuminate\Http\Request;

class PriceProposalController extends Controller
{
    public function __construct(
        private PriceProposalService $proposalService,
        private PriceProposalCsvExporter $csvExporter,
    ) {}

    /**
     * لیست پیشنهادهای قیمت. اگر batch_id داده نشود، آخرین batch (جدیدترین
     * اجرا - چک خودکار یا override دستی) به‌صورت پیش‌فرض نمایش داده می‌شود.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', ProductPriceProposal::class);

        $batchId = $request->query('batch_id') ?? ProductPriceProposal::query()->latest('id')->value('batch_id');

        if (! $batchId) {
            return ProductPriceProposalResource::collection(collect());
        }

        $proposals = ProductPriceProposal::query()
            ->where('batch_id', $batchId)
            ->with('product:id,name,sku')
            ->orderBy('id')
            ->paginate(min((int) $request->query('per_page', 50), 200));

        return ProductPriceProposalResource::collection($proposals);
    }

    /** خروجی CSV فقط-خواندنی برای یک batch - هرگز ذخیره نمی‌شود، فقط تولید و پاسخ داده می‌شود. */
    public function exportCsv(string $batchId)
    {
        $this->authorize('viewAny', ProductPriceProposal::class);

        $csv = $this->csvExporter->exportForBatch($batchId);

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=price-proposals-{$batchId}.csv",
        ]);
    }

    public function update(UpdatePriceProposalRequest $request, ProductPriceProposal $proposal)
    {
        $this->guardNotFinal($proposal);

        $proposal = $this->proposalService->editProposedValue(
            $proposal,
            (int) $request->validated('edited_price_toman'),
            $request->user()->id
        );

        return new ProductPriceProposalResource($proposal);
    }

    public function approve(Request $request, ProductPriceProposal $proposal)
    {
        $this->authorize('review', ProductPriceProposal::class);
        $this->guardNotFinal($proposal);

        $proposal = $this->proposalService->approveOne($proposal, $request->user()->id);

        return new ProductPriceProposalResource($proposal);
    }

    public function reject(Request $request, ProductPriceProposal $proposal)
    {
        $this->authorize('review', ProductPriceProposal::class);
        $this->guardNotFinal($proposal);

        $proposal = $this->proposalService->rejectOne($proposal, $request->user()->id);

        return new ProductPriceProposalResource($proposal);
    }

    public function approveBatch(Request $request, string $batchId)
    {
        $this->authorize('review', ProductPriceProposal::class);

        $count = $this->proposalService->approveBatch($batchId, $request->user()->id);

        return response()->json(['message' => "تعداد {$count} پیشنهاد قیمت تایید شد."]);
    }

    public function rejectBatch(Request $request, string $batchId)
    {
        $this->authorize('review', ProductPriceProposal::class);

        $count = $this->proposalService->rejectBatch($batchId, $request->user()->id);

        return response()->json(['message' => "تعداد {$count} پیشنهاد قیمت رد شد."]);
    }

    private function guardNotFinal(ProductPriceProposal $proposal): void
    {
        if ($proposal->status->isFinal()) {
            throw PriceProposalAlreadyReviewedException::alreadyReviewed();
        }
    }
}
```


---

## `app\Http\Controllers\Api\V1\Admin\ProductController.php`

```php
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
```


---

## `app\Http\Controllers\Api\V1\Admin\ProductMediaController.php`

```php
<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Product\StoreProductImageRequest;
use App\Http\Requests\Api\V1\Product\StoreProductVideoRequest;
use App\Http\Resources\ProductImageResource;
use App\Http\Resources\ProductVideoResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVideo;
use App\Services\Media\ProductMediaService;

class ProductMediaController extends Controller
{
    public function __construct(private ProductMediaService $mediaService) {}

    public function storeImages(StoreProductImageRequest $request, Product $product)
    {
        // fix: explicit authorize call added for defense in depth, matching
        // the other four methods below. Previously this action relied only
        // on StoreProductImageRequest::authorize(), a file not present in
        // the delivered backend, so it could not be verified here.
        $this->authorize('manage', Product::class);

        $images = $this->mediaService->storeImages(
            $product,
            $request->file('images'),
            $request->input('alt_texts', [])
        );

        return ProductImageResource::collection($images);
    }

    public function setPrimaryImage(Product $product, ProductImage $image)
    {
        $this->authorize('manage', Product::class);

        $this->mediaService->setPrimaryImage($product, $image);

        return response()->json(['message' => 'Primary image updated successfully.']);
    }

    public function destroyImage(Product $product, ProductImage $image)
    {
        $this->authorize('manage', Product::class);

        if ($image->product_id !== $product->id) {
            abort(404);
        }

        $this->mediaService->deleteImage($image);

        return response()->json(['message' => 'Image deleted successfully.']);
    }

    public function storeVideo(StoreProductVideoRequest $request, Product $product)
    {
        // fix: explicit authorize call added, same reasoning as storeImages above.
        $this->authorize('manage', Product::class);

        // fix: the original controller never passed the uploaded file to
        // storeVideo(). For source_type=upload, ProductMediaService::storeVideo()
        // always received $file=null and threw
        // ProductMediaValidationException::videoFileMissing(), so uploaded
        // video files could never actually be saved. Passing
        // $request->file('video') fixes this.
        $video = $this->mediaService->storeVideo(
            $product,
            $request->validated(),
            $request->file('video')
        );

        return (new ProductVideoResource($video))->response()->setStatusCode(201);
    }

    public function destroyVideo(Product $product, ProductVideo $video)
    {
        $this->authorize('manage', Product::class);

        if ($video->product_id !== $product->id) {
            abort(404);
        }

        $this->mediaService->deleteVideo($video);

        return response()->json(['message' => 'Video deleted successfully.']);
    }
}
```


---

## `app\Http\Controllers\Api\V1\Public\ProductController.php`

```php
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
```


---

## `app\Http\Requests\Api\V1\Product\AdminProductIndexRequest.php`

```php
<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;

class AdminProductIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Product::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'is_active' => ['nullable', 'boolean'],
            'stock_status' => ['nullable', 'in:in_stock,out_of_stock,preorder'],
            // برخلاف لیست عمومی، محصولات غیرفعال هم باید برای ادمین دیده بشن؛
            // برای همین از ProductFilterService (که ->active() رو اجباری می‌کنه) استفاده نمی‌کنیم
            'sort' => ['nullable', 'in:newest,oldest,price_asc,price_desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'page' => ['nullable', 'integer', 'min:1', 'max:100000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_active')) {
            $this->merge(['is_active' => filter_var($this->query('is_active'), FILTER_VALIDATE_BOOLEAN)]);
        }
    }
}
```


---

## `app\Http\Requests\Api\V1\Product\ProductIndexRequest.php`

```php
<?php

namespace App\Http\Requests\Api\V1\Product;

use Illuminate\Foundation\Http\FormRequest;

class ProductIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // دیدن لیست محصولات برای همه آزاده
    }

    public function rules(): array
    {
        return [
            // regex: فقط حروف/عدد/خط‌تیره - جلوگیری از فرمت‌های عجیب قبل از رسیدن به دیتابیس
            'category_slug' => ['nullable', 'string', 'max:230', 'regex:/^[a-z0-9\-]+$/i'],
            'search' => ['nullable', 'string', 'max:100'],
            'min_price' => ['nullable', 'integer', 'min:0'],
            'max_price' => ['nullable', 'integer', 'min:0', 'gte:min_price'],
            'in_stock' => ['nullable', 'boolean'],
            'has_discount' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
            // whitelist دقیق - جلوگیری از SQL injection از طریق sort
            'sort' => ['nullable', 'in:newest,oldest,price_asc,price_desc,most_purchased,most_liked,most_viewed'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'], // جلوگیری از DoS با per_page=999999
            'page' => ['nullable', 'integer', 'min:1', 'max:100000'], // جلوگیری از OFFSET غول‌آسا روی صفحات دور
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['in_stock', 'has_discount', 'is_featured'] as $field) {
            if ($this->has($field)) {
                $this->merge([$field => filter_var($this->query($field), FILTER_VALIDATE_BOOLEAN)]);
            }
        }
    }
}
```


---

## `app\Http\Requests\Api\V1\Product\StoreProductImageRequest.php`

```php
<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage', Product::class) ?? false;
    }

    public function rules(): array
    {
        return [
            // چندتایی: فرانت می‌تونه چند فایل هم‌زمان با کلید images[] بفرسته
            'images' => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => [
                'required',
                'image', // این قانون خودِ لاراول محتوای واقعی فایل رو با fileinfo چک می‌کنه، نه فقط پسوند
                'mimes:jpg,jpeg,png,webp',
                'max:5120', // حداکثر ۵ مگابایت
                'dimensions:min_width=200,min_height=200,max_width=6000,max_height=6000',
            ],
            'alt_texts' => ['nullable', 'array'],
            'alt_texts.*' => ['nullable', 'string', 'max:200'],
        ];
    }

    public function messages(): array
    {
        return [
            'images.*.mimes' => 'فقط فرمت‌های jpg، png و webp مجاز هستند.',
            'images.*.max' => 'حجم هر عکس نباید بیشتر از ۵ مگابایت باشد.',
            'images.*.dimensions' => 'ابعاد عکس باید بین ۲۰۰×۲۰۰ تا ۶۰۰۰×۶۰۰۰ پیکسل باشد.',
        ];
    }
}
```


---

## `app\Http\Requests\Api\V1\Product\StoreProductRequest.php`

```php
<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Product::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'min:2', 'max:200'],
            'sku' => ['required', 'string', 'max:64', 'unique:products,sku', 'alpha_dash'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:20000'],

            // قیمت دیگه مستقیم تومانی نیست - فقط دلار؛ تومان توسط PricingService محاسبه می‌شه
            'price_usd' => ['required', 'numeric', 'min:0.01', 'max:999999.99'],

            'discount_type' => ['nullable', 'in:percent,fixed'],
            'discount_value' => ['nullable', 'required_with:discount_type', 'integer', 'min:0'],
            // ولیدیشن «تخفیف ثابت <= قیمت» دیگه اینجا ممکن نیست چون قیمت تومانی
            // قبل از محاسبه‌ی سرویس معلوم نیست - این چک تو PricingService::assertDiscountValid انجام می‌شه
            'discount_starts_at' => ['nullable', 'date'],
            'discount_ends_at' => ['nullable', 'date', 'after:discount_starts_at'],

            'stock_quantity' => ['required', 'integer', 'min:0', 'max:1000000'],
            'stock_status' => ['required', 'in:in_stock,out_of_stock,preorder'],
            'weight_grams' => ['nullable', 'integer', 'min:0', 'max:1000000'],

            'is_active' => ['nullable', 'boolean'],

            'meta' => ['nullable', 'array'],
            'meta.meta_title' => ['nullable', 'string', 'max:180'],
            'meta.meta_description' => ['nullable', 'string', 'max:300'],
            'tag_ids' => ['nullable', 'array', 'max:50'],
            'tag_ids.*' => ['integer', 'distinct', 'exists:tags,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'sku.unique' => 'این SKU قبلاً برای محصول دیگری ثبت شده است.',
            'sku.alpha_dash' => 'SKU فقط می‌تواند شامل حروف انگلیسی، عدد، خط‌تیره و آندرلاین باشد.',
            'price_usd.required' => 'قیمت دلاری محصول الزامی است.',
        ];
    }
}
```


---

## `app\Http\Requests\Api\V1\Product\StoreProductVideoRequest.php`

```php
<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductVideoRequest extends FormRequest
{
    private const ALLOWED_HOSTS = [
        'youtube' => ['youtube.com', 'www.youtube.com', 'youtu.be'],
        'aparat' => ['aparat.com', 'www.aparat.com'],
    ];

    public function authorize(): bool
    {
        return $this->user()?->can('manage', Product::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'source_type' => ['required', 'in:youtube,aparat,external'],
            'file' => [
            'required_if:source_type,upload',
            'file',
            'mimetypes:video/mp4,video/webm,video/ogg',
            'max:51200', // ۵۰ مگابایت سقف - جلوی آپلود فایل غول‌آسا رو می‌گیره
            ],
            'external_url' => [
                'required',
                'url',
                'max:500',
                function ($attribute, $value, $fail) {
                    if ($this->input('source_type') === 'upload') return;
                    $sourceType = $this->input('source_type');
                    $host = parse_url($value, PHP_URL_HOST);
                    $allowedHosts = self::ALLOWED_HOSTS[$sourceType] ?? null;

                    if ($allowedHosts && !in_array($host, $allowedHosts, true)) {
                        $fail("لینک وارد شده با پلتفرم انتخاب‌شده ({$sourceType}) مطابقت ندارد.");
                    }
                },
            ],
            'title' => ['nullable', 'string', 'max:200'],
        ];
    }
}
```


---

## `app\Http\Requests\Api\V1\Product\UpdateProductRequest.php`

```php
<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage', Product::class) ?? false;
    }

    public function rules(): array
    {
        /** @var Product $product */
        $product = $this->route('product');

        return [
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:200'],
            'sku' => [
                'sometimes', 'required', 'string', 'max:64', 'alpha_dash',
                Rule::unique('products', 'sku')->ignore($product->id),
            ],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:20000'],

            // قبلاً 'price' (ستون قدیمی تومانی) اعتبارسنجی می‌شد که بعد از
            // مایگریشن price -> price_toman دیگه اصلاً به ProductService نمی‌رسید
            // (چون ProductService::update فقط دنبال price_usd می‌گردد)؛ یعنی این
            // فرم درخواست عملاً امکان تغییر قیمت محصول را از ادمین گرفته بود.
            // مثل StoreProductRequest، فقط price_usd می‌گیریم؛ price_toman توسط
            // PricingService با آخرین نرخ دلار محاسبه می‌شود.
            'price_usd' => ['sometimes', 'required', 'numeric', 'min:0.01', 'max:999999.99'],

            'discount_type' => ['nullable', 'in:percent,fixed'],
            'discount_value' => ['nullable', 'required_with:discount_type', 'integer', 'min:0'],
            'discount_starts_at' => ['nullable', 'date'],
            'discount_ends_at' => ['nullable', 'date', 'after:discount_starts_at'],

            'stock_quantity' => ['sometimes', 'required', 'integer', 'min:0', 'max:1000000'],
            'stock_status' => ['sometimes', 'required', 'in:in_stock,out_of_stock,preorder'],
            'weight_grams' => ['nullable', 'integer', 'min:0', 'max:1000000'],

            'is_active' => ['nullable', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:180'],
            'meta_description' => ['nullable', 'string', 'max:300'],
        ];
    }

    public function messages(): array
    {
        return [
            'price_usd.required' => 'قیمت دلاری محصول الزامی است.',
        ];
    }
}
```


---

## `app\Http\Resources\ProductImageResource.php`

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url,
            'alt_text' => $this->alt_text,
            'is_primary' => $this->is_primary,
            'sort_order' => $this->sort_order,
        ];
    }
}
```


---

## `app\Http\Resources\ProductListResource.php`

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            // اضافه شد: جدول محصولات فرانت ستون SKU نداشت چون این ریسورس
            // اصلاً sku را برنمی‌گرداند (فقط ProductResource کامل آن را داشت).
            'sku' => $this->sku,
            'short_description' => $this->short_description,
            // ستون دیتابیس با مایگریشن add_usd_pricing_to_products_table از
            // 'price' به 'price_toman' تغییر نام کرد؛ چون این ریسورس هنوز
            // به‌جای $this->price_toman از $this->price می‌خوند، مقدار 'price'
            // در پاسخ API همیشه null برمی‌گشت. کلید JSON عمداً 'price' نگه
            // داشته شده تا قرارداد فرانتِ فعلی نشکنه؛ فقط منبع مقدار درست شده.
            'price' => $this->price_toman,
            'final_price' => $this->final_price,
            'discount_percentage' => $this->discount_percentage,
            'has_active_discount' => $this->has_active_discount,
            'stock_status' => $this->stock_status,
            'is_featured' => $this->is_featured,
            'purchases_count' => $this->purchases_count,
            'created_at' => $this->created_at?->toIso8601String(),
            // فقط برای آیتم‌های سطل‌زباله مقدار داره؛ بقیه‌ی جاها همیشه null می‌مونه.
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'category' => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ],
            'primary_image' => $this->whenLoaded(
                'primaryImage',
                fn () => $this->primaryImage ? new ProductImageResource($this->primaryImage) : null
            ),
        ];
    }
}
```


---

## `app\Http\Resources\ProductPriceProposalResource.php`

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductPriceProposalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'batch_id' => $this->batch_id,
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
            ],
            'old_price_toman' => $this->old_price_toman,
            'new_price_toman' => $this->new_price_toman,
            'edited_price_toman' => $this->edited_price_toman,
            'effective_price_toman' => $this->effective_price_toman,
            'status' => $this->status->value,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
```


---

## `app\Http\Resources\ProductResource.php`

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'short_description' => $this->short_description,
            'description' => $this->description,

            // مثل ProductListResource: ستون دیتابیس به 'price_toman' تغییر نام
            // کرد ولی این ریسورس هنوز از $this->price (ناموجود) می‌خوند و
            // مقدار 'price' همیشه null برمی‌گشت. کلید JSON 'price' حفظ شد.
            'price' => $this->price_toman,
            // اضافه شد: تا این ریسورس اضافه نشده بود، فرانت هیچ راهی برای
            // پرکردن خودکار قیمت دلاری در فرم ویرایش نداشت (چون تنها منبع
            // نوشتنِ قیمت الان price_usd است، نه price/price_toman).
            'price_usd' => $this->price_usd,
            'final_price' => $this->final_price,
            'discount_percentage' => $this->discount_percentage,
            'has_active_discount' => $this->has_active_discount,
            'discount_type' => $this->discount_type?->value,
            'discount_value' => $this->discount_value,
            // اضافه شد: قبلاً فقط discount_ends_at برمی‌گشت، پس فرم ویرایش هر
            // بار discount_starts_at را null می‌فرستاد و تاریخ شروع تخفیف موجود
            // را پاک می‌کرد (data loss در هر ویرایش).
            'discount_starts_at' => $this->discount_starts_at?->toIso8601String(),
            'discount_ends_at' => $this->discount_ends_at?->toIso8601String(),

            'stock_quantity' => $this->stock_quantity,
            'stock_status' => $this->stock_status,
            'weight_grams' => $this->weight_grams,

            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
            'views_count' => $this->views_count,
            'purchases_count' => $this->purchases_count,
            'likes_count' => $this->likes_count,

            'category' => new CategoryResource($this->whenLoaded('category')),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'videos' => ProductVideoResource::collection($this->whenLoaded('videos')),

            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
```


---

## `app\Http\Resources\ProductVideoResource.php`

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVideoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'source_type' => $this->source_type,
            'url' => $this->source_type === 'upload' ? $this->url : $this->external_url,
            'external_id' => $this->external_id,
            'thumbnail_url' => $this->thumbnail_url,
            'title' => $this->title,
            'sort_order' => $this->sort_order,
        ];
    }
}
```


---

## `app\Jobs\RecalculateProductPricesJob.php`

```php
<?php

namespace App\Jobs;

use App\Models\ExchangeRate;
use App\Models\Product;
use App\Services\Pricing\PricingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RecalculateProductPricesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private int $exchangeRateId) {}

    public function handle(PricingService $pricingService): void
    {
        $rate = ExchangeRate::find($this->exchangeRateId);

        if (! $rate || $rate->status !== 'applied') {
            Log::warning('recalculate_prices.invalid_rate', ['exchange_rate_id' => $this->exchangeRateId]);

            return;
        }

        $updated = 0;

        Product::query()
            ->where('price_usd', '>', 0)
            ->chunkById(200, function ($products) use ($pricingService, $rate, &$updated) {
                DB::transaction(function () use ($products, $pricingService, $rate, &$updated) {
                    foreach ($products as $product) {
                        $newPrice = $pricingService->computeTomanPrice($product, $rate);

                        if ($newPrice !== $product->price_toman) {
                            $product->update(['price_toman' => $newPrice]);
                            $updated++;
                        }
                    }
                });
            });

        Log::info('recalculate_prices.done', ['exchange_rate_id' => $rate->id, 'updated_count' => $updated]);
    }
}
```


---

## `app\Models\Category.php`

```php
<?php

namespace App\Models;

use App\Models\Concerns\HasMeta;
use App\Models\Concerns\HasTags;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasFactory, SoftDeletes, HasTags, HasMeta;

    /**
     * Root = depth 0
     *
     * بنابراین با MAX_DEPTH = 4
     * بیشترین تعداد level برابر 5 سطح است:
     *
     * 0 → 1 → 2 → 3 → 4
     */
    public const MAX_DEPTH = 4;

    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'description',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'parent_id' => 'integer',
        'is_active' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')
            ->orderBy('name');
    }

    public function childrenRecursive(): HasMany
    {
        return $this->children()->with('childrenRecursive');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeRootLevel($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * عمق Category را محاسبه می‌کند.
     *
     * این متد فقط برای بررسی یک node استفاده می‌شود.
     * منطق جلوگیری از انتقال subtree در Service انجام می‌شود.
     */
    public function depth(): int
    {
        $depth = 0;
        $node = $this;

        while ($node->parent_id !== null) {
            $node = $node->parent;

            if (! $node) {
                break;
            }

            $depth++;

            // دفاع در برابر داده خراب/cycle موجود در DB.
            if ($depth > self::MAX_DEPTH + 1) {
                throw new \LogicException(
                    'ساختار درخت دسته‌بندی نامعتبر است.'
                );
            }
        }

        return $depth;
    }

    /**
     * بررسی می‌کند آیا Category مشخص‌شده descendant این Category است یا نه.
     */
    public function hasDescendant(int $candidateId): bool
    {
        if ($this->id === $candidateId) {
            return false;
        }

        $children = $this->relationLoaded('children')
            ? $this->children
            : $this->children()->get();

        foreach ($children as $child) {
            if ($child->id === $candidateId) {
                return true;
            }

            if ($child->hasDescendant($candidateId)) {
                return true;
            }
        }

        return false;
    }
}
```


---

## `app\Models\Product.php`

```php
<?php

namespace App\Models;

use App\Enums\DiscountType;
use App\Models\Concerns\HasMeta;
use App\Models\Concerns\HasTags;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes, HasTags, HasMeta;

    protected $fillable = [
        'category_id', 'name', 'slug', 'sku', 'short_description', 'description',
        'price_usd', // price_toman عمداً اینجا نیست - فقط از طریق PricingService/Job نوشته می‌شه
        'discount_type', 'discount_value', 'discount_starts_at', 'discount_ends_at',
        'stock_quantity', 'stock_status', 'weight_grams',
        'is_active', 'is_featured', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'price_usd' => 'decimal:2',
        'price_toman' => 'integer',
        'discount_type' => DiscountType::class,
        'discount_value' => 'integer',
        'discount_starts_at' => 'datetime',
        'discount_ends_at' => 'datetime',
        'stock_quantity' => 'integer',
        'weight_grams' => 'integer',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'views_count' => 'integer',
        'stock_status' => \App\Enums\StockStatus::class,
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function videos(): HasMany
    {
        return $this->hasMany(ProductVideo::class)->orderBy('sort_order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    // این سه accessor حالا فقط wrapper دور PricingService هستن تا Resource ها بدون تغییر کار کنن
    public function getHasActiveDiscountAttribute(): bool
    {
        return app(\App\Services\Pricing\PricingService::class)->hasActiveDiscount($this);
    }

    public function getFinalPriceAttribute(): int
    {
        return app(\App\Services\Pricing\PricingService::class)->computeFinalPrice($this);
    }

    public function getDiscountPercentageAttribute(): ?int
    {
        if (! $this->has_active_discount || $this->price_toman <=0){
            return null;
        }

        return (int) round((($this->price_toman - $this->final_price) / $this->price_toman) * 100);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInStock($query)
    {
        return $query->where('stock_status', '!=', 'out_of_stock')->where('stock_quantity', '>', 0);
    }
}
```


---

## `app\Models\ProductImage.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProductImage extends Model
{
    protected $fillable = ['product_id', 'disk', 'path', 'alt_text', 'is_primary', 'sort_order'];

    protected $casts = ['is_primary' => 'boolean'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }
}
```


---

## `app\Models\ProductPriceProposal.php`

```php
<?php

namespace App\Models;

use App\Enums\PriceProposalStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPriceProposal extends Model
{
    protected $fillable = [
        'batch_id', 'exchange_rate_id', 'product_id',
        'old_price_toman', 'new_price_toman', 'edited_price_toman',
        'status', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'old_price_toman' => 'integer',
        'new_price_toman' => 'integer',
        'edited_price_toman' => 'integer',
        'status' => PriceProposalStatus::class,
        'reviewed_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function exchangeRate(): BelongsTo
    {
        return $this->belongsTo(ExchangeRate::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** مقدار نهایی که در صورت approve روی محصول ست می‌شود: اصلاح دستی ادمین در اولویت است. */
    public function getEffectivePriceTomanAttribute(): int
    {
        return $this->edited_price_toman ?? $this->new_price_toman;
    }
}
```


---

## `app\Models\ProductVideo.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProductVideo extends Model
{
    protected $fillable = ['product_id', 'disk', 'path', 'thumbnail_path', 'title', 'sort_order'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->thumbnail_path ? Storage::disk($this->disk)->url($this->thumbnail_path) : null;
    }
}
```


---

## `app\Policies\ProductPolicy.php`

```php
<?php

namespace App\Policies;

use App\Models\User;

class ProductPolicy
{
    private function isEligibleStaff(User $user): bool
    {
        return $user->user_type === 'staff' && $user->is_active;
    }

    private function hasAccess(User $user, string $ability): bool
    {
        return $this->isEligibleStaff($user)
            && ($user->can("products.{$ability}") || $user->can('products.manage'));
    }

  
    private function hasTrashAccess(User $user): bool
    {
        return $this->isEligibleStaff($user) && $user->can('products.trash');
    }

    public function viewAny(User $user): bool { return $this->hasAccess($user, 'view'); }
    public function view(User $user): bool { return $this->hasAccess($user, 'view'); }
    public function create(User $user): bool { return $this->hasAccess($user, 'create'); }
    public function update(User $user): bool { return $this->hasAccess($user, 'update'); }
    public function delete(User $user): bool { return $this->hasAccess($user, 'delete'); }
    public function deleteAny(User $user): bool { return $this->hasAccess($user, 'delete'); }

    // مشاهده‌ی لیست سطل‌زباله هم پشت همون permission سخت‌گیرانه‌ست، چون
    // خودِ اسم/اطلاعات محصولات حذف‌شده می‌تونه حساس باشه.
    public function viewTrash(User $user): bool { return $this->hasTrashAccess($user); }

    public function restore(User $user): bool { return $this->hasTrashAccess($user); }
    public function restoreAny(User $user): bool { return $this->hasTrashAccess($user); }
    public function forceDelete(User $user): bool { return $this->hasTrashAccess($user); }
    public function forceDeleteAny(User $user): bool { return $this->hasTrashAccess($user); }

    public function manage(User $user): bool
    {
        return $this->isEligibleStaff($user) && $user->can('products.manage');
    }
}
```


---

## `app\Policies\ProductPriceProposalPolicy.php`

```php
<?php

namespace App\Policies;

use App\Models\User;

class ProductPriceProposalPolicy
{
    // باگ امنیتی واقعی (همون الگویی که در ProductPolicy هم وجود دارد): این مقدار
    // قبلاً فقط user_type === 'staff' رو مجاز می‌دانست، در حالی که طبق AuthUser.type
    // در فرانت، هم 'admin' هم 'staff' از نقش‌های پنل ادمین محسوب می‌شنند. با منطق قبلی، یک
    // ادمین واقعی با permission درست (prices.review یا prices.manage) هم 403 می‌گرفت. اینجا همون
    // مجموعه‌ی STAFF_USER_TYPES که طرف فرانت (ProtectedRoute.tsx) استفاده می‌شه رو روی
    // بک‌اند هم اعمال می‌کنیم.
    private const ELIGIBLE_STAFF_TYPES = ['admin', 'staff'];

    private function isEligibleStaff(User $user): bool
    {
        return in_array($user->user_type, self::ELIGIBLE_STAFF_TYPES, true) && $user->is_active;
    }

    // بررسی/تایید/رد پیشنهادهای قیمت - permission جدید prices.review، جدا از
    // products.manage، چون تایید انبوه‌ی قیمت‌ها حساس‌تره از ویرایش یک محصوله. پیش‌فرض:
    // اگه prices.review نبود ولی prices.manage بود هم قبول می‌شه (قابل تقییر بعداً اگه بخوای
    // کاملاً مجزا باشه).
    public function viewAny(User $user): bool
    {
        return $this->isEligibleStaff($user) && ($user->can('prices.review') || $user->can('prices.manage'));
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function review(User $user): bool
    {
        return $this->viewAny($user);
    }
}
```


---

## `app\Providers\AppServiceProvider.php`

```php
<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Policies\CategoryPolicy;
use App\Policies\ProductPolicy;
use App\Services\Mail\LaravelMailOtpService;
use App\Services\Mail\MailServiceInterface;
use App\Services\Sms\LogSmsService;
use App\Services\Sms\SmsServiceInterface;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(SmsServiceInterface::class, LogSmsService::class);
        $this->app->bind(MailServiceInterface::class, LaravelMailOtpService::class);
        $this->app->bind(
            \App\Services\Pricing\ExchangeRateProviderInterface::class,
            \App\Services\Pricing\NavasanExchangeRateProvider::class
        );
    }

    public function boot(): void
    {
        // پالیسی‌های محصول/دسته‌بندی - پنل Filament و هر جای دیگه‌ی برنامه از همینا استفاده می‌کنن
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);

        // فقط این مدل‌ها اجازه دارن taggable/metable باشن — بدون این، هر مدلی
        // (حتی User یا Order) از نظر DB می‌تونست به‌عنوان taggable_type/metable_type ثبت بشه.
        //
        // نکته مهم: enforceMorphMap سراسریه و روی همه‌ی رابطه‌های polymorphic
        // کل اپلیکیشن اعمال می‌شه — از جمله رابطه‌ی داخلی Sanctum بین
        // PersonalAccessToken و User (tokenable). به همین دلیل User هم باید
        // اینجا ثبت بشه، وگرنه لاگین/احراز هویت با ClassMorphViolationException
        // شکست می‌خوره.
        Relation::enforceMorphMap([
            'category' => Category::class,
            'product' => Product::class,
            'user' => User::class,
            // 'blog' => \App\Models\Blog::class, // وقتی مدل Blog ساخته شد اضافه کن
        ]);

        // حداکثر ۶ تلاش ورود در دقیقه، بر اساس ترکیب IP و شناسه ورودی (ضد Brute-force)
        RateLimiter::for('admin-login', function (Request $request) {
            $key = strtolower((string) $request->input('login')).'|'.$request->ip();

            return Limit::perMinute(6)->by($key);
        });

        // حداکثر ۳ درخواست ارسال کد در دقیقه بر اساس IP (علاوه بر cooldown داخل Redis)
        RateLimiter::for('otp-send', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });

        // حداکثر ۱۰ تلاش verify در دقیقه بر اساس IP
        RateLimiter::for('otp-verify', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        // محدودیت درخواست فراموشی رمز عبور
        RateLimiter::for('password-reset', function (Request $request) {
            return Limit::perMinute(6)->by($request->ip());
        });
    }
}
```


---

## `app\Services\Category\CategoryService.php`

```php
<?php

namespace App\Services\Category;

use App\Models\Category;
use App\Services\Slug\SlugUniquenessResolver;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class CategoryService
{
    public function __construct(
        private SlugUniquenessResolver $slugResolver
    ) {}

    public function create(array $data, int $userId): Category
    {
        return DB::transaction(function () use ($data, $userId) {

            $parent = $this->resolveParent(
                $data['parent_id'] ?? null
            );

            $this->assertValidParentForCreate($parent);

            $categoryData = Arr::except(
                $data,
                ['meta', 'tag_ids']
            );

            $categoryData['slug'] = $this->slugResolver->resolve(
                $data['name'],
                Category::class
            );

            $categoryData['created_by'] = $userId;

            $categoryData['description'] =
                $this->sanitizeDescription(
                    $categoryData['description'] ?? null
                );

            $category = Category::create($categoryData);

            $category->syncMeta(
                $data['meta'] ?? null
            );

            $category->syncTags(
                $data['tag_ids'] ?? []
            );

            Log::info('category.created', [
                'category_id' => $category->id,
                'user_id' => $userId,
            ]);

            return $category->fresh([
                'tags',
                'meta',
                'children',
            ]);
        });
    }

    public function update(
        Category $category,
        array $data
    ): Category {

        return DB::transaction(function () use ($category, $data) {

            /*
             * Category ممکن است در فاصله دریافت Request
             * تا اجرای Service تغییر کرده باشد.
             *
             * بنابراین دوباره از DB می‌خوانیم.
             */
            $category->refresh();

            $newParentId = array_key_exists(
                'parent_id',
                $data
            )
                ? $data['parent_id']
                : $category->parent_id;

            $parent = $this->resolveParent($newParentId);

            $this->assertValidParentForUpdate(
                $category,
                $parent
            );

            $categoryData = Arr::except(
                $data,
                ['meta', 'tag_ids']
            );

            if (
                isset($categoryData['name']) &&
                $categoryData['name'] !== $category->name
            ) {
                $categoryData['slug'] =
                    $this->slugResolver->resolve(
                        $categoryData['name'],
                        Category::class,
                        $category->id
                    );
            }

            if (array_key_exists(
                'description',
                $categoryData
            )) {
                $categoryData['description'] =
                    $this->sanitizeDescription(
                        $categoryData['description']
                    );
            }

            /*
             * اگر parent تغییر می‌کند، کل subtree باید
             * از نظر MAX_DEPTH بررسی شود.
             */
            if (
                $newParentId !== $category->parent_id
            ) {
                $this->assertSubtreeDepthAllowed(
                    $category,
                    $parent
                );
            }

            $category->update($categoryData);

            if (array_key_exists('meta', $data)) {
                $category->syncMeta($data['meta']);
            }

            if (array_key_exists('tag_ids', $data)) {
                $category->syncTags($data['tag_ids']);
            }

            Log::info('category.updated', [
                'category_id' => $category->id,
            ]);

            return $category->fresh([
                'tags',
                'meta',
                'children',
            ]);
        });
    }

    public function delete(Category $category): void
    {
        DB::transaction(function () use ($category) {

            $category->refresh();

            if ($category->children()->exists()) {
                throw new \DomainException(
                    'این دسته‌بندی دارای زیردسته است.'
                );
            }

            if ($category->products()->exists()) {
                throw new \DomainException(
                    'این دسته‌بندی دارای محصول است.'
                );
            }

            $category->delete();

            Log::info('category.soft_deleted', [
                'category_id' => $category->id,
            ]);
        });
    }

    public function restore(Category $category): Category
    {
        return DB::transaction(function () use ($category) {

            /*
             * Parent ممکن است در زمانی که این Category
             * در Trash بوده حذف شده باشد.
             */
            $parent = $category->parent()
                ->whereNull('deleted_at')
                ->first();

            if ($category->parent_id !== null && ! $parent) {
                throw new \DomainException(
                    'والد این دسته‌بندی دیگر قابل استفاده نیست.'
                );
            }

            if ($parent) {
                $this->assertValidParentForCreate(
                    $parent
                );
            }

            $category->restore();

            Log::info('category.restored', [
                'category_id' => $category->id,
            ]);

            return $category->fresh();
        });
    }

    public function forceDelete(Category $category): void
    {
        DB::transaction(function () use ($category) {

            if (
                $category
                    ->children()
                    ->withTrashed()
                    ->exists()
            ) {
                throw new \DomainException(
                    'این دسته‌بندی دارای زیردسته است.'
                );
            }

            if ($category->products()->exists()) {
                throw new \DomainException(
                    'این دسته‌بندی دارای محصول است.'
                );
            }

            $category->tags()->detach();
            $category->meta()->delete();

            $category->forceDelete();

            Log::warning('category.force_deleted', [
                'category_id' => $category->id,
            ]);
        });
    }

    private function resolveParent(
        ?int $parentId
    ): ?Category {

        if ($parentId === null) {
            return null;
        }

        return Category::query()
            ->whereKey($parentId)
            ->whereNull('deleted_at')
            ->firstOrFail();
    }

    private function assertValidParentForCreate(
        ?Category $parent
    ): void {

        if (! $parent) {
            return;
        }

        if ($parent->depth() >= Category::MAX_DEPTH) {
            throw ValidationException::withMessages([
                'parent_id' =>
                    'این دسته‌بندی والد به حداکثر عمق مجاز رسیده است.',
            ]);
        }
    }

    private function assertValidParentForUpdate(
        Category $category,
        ?Category $parent
    ): void {

        if (! $parent) {
            return;
        }

        if ($parent->id === $category->id) {
            throw ValidationException::withMessages([
                'parent_id' =>
                    'یک دسته‌بندی نمی‌تواند والد خودش باشد.',
            ]);
        }

        if ($category->hasDescendant($parent->id)) {
            throw ValidationException::withMessages([
                'parent_id' =>
                    'نمی‌توان یکی از زیردسته‌ها را والد قرار داد.',
            ]);
        }
    }

    private function assertSubtreeDepthAllowed(
        Category $category,
        ?Category $newParent
    ): void {

        if (! $newParent) {
            /*
             * انتقال به root همیشه از نظر depth مجاز است.
             */
            return;
        }

        $parentDepth = $newParent->depth();

        $subtreeHeight = $this->subtreeHeight(
            $category
        );

        /*
         * مثال:
         *
         * parent = depth 2
         * subtree height = 2
         *
         * deepest node = 2 + 1 + 2 = 5
         *
         * اگر MAX_DEPTH = 4 → ممنوع
         */
        $deepestDepth =
            $parentDepth +
            1 +
            $subtreeHeight;

        if ($deepestDepth > Category::MAX_DEPTH) {
            throw ValidationException::withMessages([
                'parent_id' =>
                    'انتقال این دسته‌بندی باعث عبور یکی از زیرشاخه‌ها از حداکثر عمق مجاز می‌شود.',
            ]);
        }
    }

    private function subtreeHeight(
        Category $category
    ): int {

        $children = $category->children()->get();

        if ($children->isEmpty()) {
            return 0;
        }

        $max = 0;

        foreach ($children as $child) {
            $max = max(
                $max,
                1 + $this->subtreeHeight($child)
            );
        }

        return $max;
    }

    private function sanitizeDescription(
        ?string $value
    ): ?string {

        return $value !== null
            ? strip_tags($value)
            : null;
    }
}
```


---

## `app\Services\Media\ProductMediaService.php`

```php
<?php

namespace App\Services\Media;

use App\Exceptions\Product\ProductMediaNotFoundException;
use App\Exceptions\Product\ProductMediaValidationException;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVideo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductMediaService
{
    private const DISK = 'public';
    private const IMAGE_DIR_PREFIX = 'products/images';
    private const VIDEO_DIR_PREFIX = 'products/videos';

    // همون محدودیت‌های StoreProductImageRequest - اینجا هم اجرا میشن چون پنل ادمین از اون FormRequest رد نمیشه
    private const MAX_IMAGES_PER_UPLOAD = 10;
    private const MAX_IMAGE_SIZE_KB = 5120; // ۵ مگابایت
    private const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    private const MAX_VIDEOS_PER_PRODUCT = 5;
    private const MAX_VIDEO_SIZE_KB = 51200; // ۵۰ مگابایت
    private const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/ogg'];

    /**
     * @param UploadedFile[] $files
     * @param string[] $altTexts
     */
    public function storeImages(Product $product, array $files, array $altTexts = []): array
    {
        if (count($files) > self::MAX_IMAGES_PER_UPLOAD) {
            throw ProductMediaValidationException::tooManyImages(self::MAX_IMAGES_PER_UPLOAD);
        }

        // پیش‌بررسی همه‌ی فایل‌ها قبل از ذخیره‌ی هرکدوم روی دیسک -
        // جلوی «فایل یتیم» رو می‌گیره: اگه فایل سوم نامعتبر بود، نمی‌خوایم
        // فایل اول/دوم از قبل نوشته شده باشن ولی رکورد DB نداشته باشن (رول‌بک ترنزکشن دیسک رو پاک نمی‌کنه)
        foreach ($files as $file) {
            $this->assertValidImage($file);
        }

        return DB::transaction(function () use ($product, $files, $altTexts) {
            $created = [];
            $hasPrimaryAlready = $product->images()->where('is_primary', true)->exists();
            $nextSortOrder = (int) $product->images()->max('sort_order') + 1;

            foreach ($files as $index => $file) {
                $path = $this->storeSecurely($file, $product->id);

                $created[] = ProductImage::create([
                    'product_id' => $product->id,
                    'disk' => self::DISK,
                    'path' => $path,
                    'alt_text' => $altTexts[$index] ?? null,
                    'is_primary' => !$hasPrimaryAlready && $index === 0,
                    'sort_order' => $nextSortOrder + $index,
                ]);
            }

            return $created;
        });
    }

    private function assertValidImage(UploadedFile $file): void
    {
        if ($file->getSize() > self::MAX_IMAGE_SIZE_KB * 1024) {
            throw ProductMediaValidationException::imageTooLarge((int) (self::MAX_IMAGE_SIZE_KB / 1024));
        }

        // چک واقعی محتوای فایل (نه پسوند/mime ارسالی کاربر) - جلوی آپلود اسکریپت با پسوند جعلی
        $imageInfo = @getimagesize($file->getRealPath());
        if ($imageInfo === false || !in_array($imageInfo['mime'], self::ALLOWED_IMAGE_MIMES, true)) {
            throw ProductMediaValidationException::invalidImage();
        }
    }

    private function storeSecurely(UploadedFile $file, int $productId): string
    {
        // اعتبارسنجی قبلاً در assertValidImage انجام شده؛ اینجا فقط دوباره mime رو برای تعیین پسوند می‌خونیم
        $imageInfo = getimagesize($file->getRealPath());

        $extension = match ($imageInfo['mime']) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        };

        // نام فایل کاملاً تصادفی - هرگز از نام اصلی آپلودی کاربر استفاده نمی‌کنیم
        // (جلوگیری از Path Traversal مثل "../../.env.jpg")
        $filename = Str::uuid()->toString().'.'.$extension;
        $directory = self::IMAGE_DIR_PREFIX."/{$productId}";

        return $file->storeAs($directory, $filename, self::DISK);
    }

    public function setPrimaryImage(Product $product, ProductImage $image): void
    {
        if ($image->product_id !== $product->id) {
            throw ProductMediaNotFoundException::imageNotOwnedByProduct();
        }

        DB::transaction(function () use ($product, $image) {
            $product->images()->where('is_primary', true)->update(['is_primary' => false]);
            $image->update(['is_primary' => true]);
        });
    }

    public function deleteImage(ProductImage $image): void
    {
        $wasPrimary = $image->is_primary;
        $productId = $image->product_id;
        $disk = $image->disk;
        $path = $image->path;

        // ترتیب عمداً عوض شد: اول رکورد DB رو داخل ترنزکشن حذف می‌کنیم و فقط بعد
        // از commit موفق، فایل دیسک رو پاک می‌کنیم. اگه پاک‌سازی دیسک شکست بخوره،
        // فقط یک فایل یتیم بی‌خطر روی دیسک می‌مونه؛ حالت قبلی برعکس بود: اگه بعد از
        // پاک شدن فایل از دیسک، حذف DB به هر دلیلی شکست می‌خورد، یک رکورد یتیم در
        // DB می‌ماند که به فایل ناموجود اشاره می‌کند و باعث ۴۰۴ در نمایش می‌شد.
        DB::transaction(function () use ($image, $wasPrimary, $productId) {
            $image->delete();

            if ($wasPrimary) {
                ProductImage::query()
                    ->where('product_id', $productId)
                    ->orderBy('sort_order')
                    ->first()
                    ?->update(['is_primary' => true]);
            }
        });

        Storage::disk($disk)->delete($path);
    }

    public function storeVideo(Product $product, array $data, ?UploadedFile $file = null): ProductVideo
    {
        if ($product->videos()->count() >= self::MAX_VIDEOS_PER_PRODUCT) {
            throw ProductMediaValidationException::tooManyVideos(self::MAX_VIDEOS_PER_PRODUCT);
        }

        if ($data['source_type'] === 'upload' && $file) {
            $this->assertValidVideo($file); // پیش‌بررسی قبل از ذخیره - همون منطق ضدیتیم‌شدن فایل
        }

        return DB::transaction(function () use ($product, $data, $file) {
            $payload = [
                'product_id' => $product->id,
                'source_type' => $data['source_type'],
                'title' => $data['title'] ?? null,
                'sort_order' => (int) $product->videos()->max('sort_order') + 1,
            ];

            if ($data['source_type'] === 'upload') {
                if (!$file) {
                    throw ProductMediaValidationException::videoFileMissing();
                }

                [$disk, $path] = $this->storeVideoFile($file, $product->id);
                $payload['disk'] = $disk;
                $payload['path'] = $path;
            } else {
                $payload['external_url'] = $data['external_url'];
                $payload['external_id'] = $this->extractExternalId($data['source_type'], $data['external_url']);
            }

            return ProductVideo::create($payload);
        });
    }

    private function assertValidVideo(UploadedFile $file): void
    {
        if ($file->getSize() > self::MAX_VIDEO_SIZE_KB * 1024) {
            throw ProductMediaValidationException::videoTooLarge((int) (self::MAX_VIDEO_SIZE_KB / 1024));
        }

        // نکته: getMimeType() برخلاف getClientMimeType()، نوع فایل رو از محتوای
        // واقعی روی دیسک (finfo) تشخیص می‌ده، نه هدر Content-Type ارسالی کلاینت؛
        // یعنی همین‌جا هم مثل assertValidImage در برابر پسوند/هدر جعلی محافظت داریم.
        if (!in_array($file->getMimeType(), self::ALLOWED_VIDEO_MIMES, true)) {
            throw ProductMediaValidationException::invalidVideo();
        }
    }

    private function storeVideoFile(UploadedFile $file, int $productId): array
    {
        $extension = match ($file->getMimeType()) {
            'video/mp4' => 'mp4',
            'video/webm' => 'webm',
            'video/ogg' => 'ogv',
        };

        $filename = Str::uuid()->toString().'.'.$extension;
        $directory = self::VIDEO_DIR_PREFIX."/{$productId}";

        $path = $file->storeAs($directory, $filename, self::DISK);

        return [self::DISK, $path];
    }

    public function deleteVideo(ProductVideo $video): void
    {
        $sourceType = $video->source_type;
        $disk = $video->disk;
        $path = $video->path;

        // همون منطق ترتیب deleteImage: اول رکورد DB، بعد فایل دیسک.
        $video->delete();

        if ($sourceType === 'upload' && $path) {
            Storage::disk($disk)->delete($path);
        }
    }

    private function extractExternalId(string $sourceType, string $url): ?string
    {
        return match ($sourceType) {
            'youtube' => $this->extractYoutubeId($url),
            'aparat' => $this->extractAparatId($url),
            default => null,
        };
    }

    private function extractYoutubeId(string $url): ?string
    {
        if (preg_match('#(?:youtu\.be/|v=)([a-zA-Z0-9_-]{11})#', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }

    private function extractAparatId(string $url): ?string
    {
        if (preg_match('#/v/([a-zA-Z0-9]+)#', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
```


---

## `app\Services\Pricing\PriceProposalCsvExporter.php`

```php
<?php

namespace App\Services\Pricing;

use App\Models\ProductPriceProposal;

class PriceProposalCsvExporter
{
    /**
     * CSV فقط خروجی است (read-only) - هرگز روی دیسک ذخیره نمی‌شود و هیچ
     * مسیر importی برایش وجود ندارد، طبق تصمیم تایید‌شده. همین متد هم برای
     * پیوست ایمیل و هم برای دانلود مستقیم از پنل ادمین استفاده می‌شود.
     */
    public function exportForBatch(string $batchId): string
    {
        $handle = fopen('php://temp', 'w+');
        fputcsv($handle, ['product_id', 'sku', 'name', 'old_price_toman', 'new_price_toman', 'effective_price_toman', 'status']);

        ProductPriceProposal::query()
            ->where('batch_id', $batchId)
            ->with('product:id,name,sku')
            ->orderBy('id')
            ->chunkById(500, function ($proposals) use ($handle) {
                foreach ($proposals as $proposal) {
                    fputcsv($handle, [
                        $proposal->product_id,
                        $proposal->product->sku ?? '',
                        $proposal->product->name ?? '',
                        $proposal->old_price_toman,
                        $proposal->new_price_toman,
                        $proposal->effective_price_toman,
                        $proposal->status->value,
                    ]);
                }
            });

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv;
    }
}
```


---

## `app\Services\Pricing\PriceProposalService.php`

```php
<?php

namespace App\Services\Pricing;

use App\Enums\PriceProposalStatus;
use App\Exceptions\Pricing\PriceProposalAlreadyReviewedException;
use App\Models\ExchangeRate;
use App\Models\Product;
use App\Models\ProductPriceProposal;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PriceProposalService
{
    public function __construct(private PricingService $pricingService) {}

    /**
     * برای همه‌ی محصولات دلاری (price_usd > 0) یک ProductPriceProposal
     * می‌سازد. این متد قیمت هیچ محصولی را تغییر نمی‌دهد - فقط پیشنهاد
     * pending_review ثبت می‌کند؛ اعمال واقعی فقط بعد از approve از طریق
     * approveOne/approveBatch اتفاق می‌افتد. هم چک هفتگی خودکار و هم
     * override دستی ادمین باید از همین متد استفاده کنند (یک مسیر واحد،
     * طبق تصمیم تایید‌شده).
     */
    public function createBatchForRate(ExchangeRate $rate): string
    {
        $batchId = (string) Str::uuid();

        Product::query()
            ->where('price_usd', '>', 0)
            ->chunkById(200, function ($products) use ($rate, $batchId) {
                DB::transaction(function () use ($products, $rate, $batchId) {
                    foreach ($products as $product) {
                        // طبق کامنت واقعی PricingService::convertUsdToToman، اون متد فقط
                        // برای ویرایش دستی price_usd خودِ محصوله، نه برای بازمحاسبه‌ی ناشی
                        // از تغییر نرخ ارز (چه هفتگی چه override دستی). این‌جا باید
                        // computeTomanPrice (با محافظت «قیمت خودکار پایین نیاد») استفاده شود.
                        $newPrice = $this->pricingService->computeTomanPrice($product, $rate);

                        ProductPriceProposal::create([
                            'batch_id' => $batchId,
                            'exchange_rate_id' => $rate->id,
                            'product_id' => $product->id,
                            'old_price_toman' => $product->price_toman,
                            'new_price_toman' => $newPrice,
                            'status' => PriceProposalStatus::PendingReview,
                        ]);
                    }
                });
            });

        return $batchId;
    }

    public function editProposedValue(ProductPriceProposal $proposal, int $newPriceToman, int $adminId): ProductPriceProposal
    {
        $this->guardNotFinal($proposal);

        $proposal->update([
            'edited_price_toman' => $newPriceToman,
            'status' => PriceProposalStatus::Edited,
        ]);

        return $proposal->fresh();
    }

    public function approveOne(ProductPriceProposal $proposal, int $adminId): ProductPriceProposal
    {
        $this->guardNotFinal($proposal);

        DB::transaction(function () use ($proposal, $adminId) {
            $product = $proposal->product;
            $effectivePrice = $proposal->edited_price_toman ?? $proposal->new_price_toman;

            // همون چک تخفیفی که ProductService::update قبل از هر تغییر قیمت
            // انجام می‌دهد - جلوگیری از اینکه تخفیف ثابت محصول بعد از اعمال
            // قیمت جدید، بزرگ‌تر از خود قیمت بشود.
            $this->pricingService->assertDiscountValid(
                $product->discount_type?->value,
                $product->discount_value,
                $effectivePrice
            );

            $product->update(['price_toman' => $effectivePrice]);

            // Bug fix: nothing previously transitioned ExchangeRate::status to
            // 'applied' after a proposal was approved, so ExchangeRate::applied()
            // (used by RefreshExchangeRateJob to find the last applied rate for
            // anomaly-percent comparisons) always returned null. Approving a
            // proposal is exactly the moment this rate takes effect, so mark it
            // applied here. Guarded so re-approving other proposals in the same
            // batch does not re-fire the update.
            if ($proposal->exchangeRate->status !== 'applied') {
                $proposal->exchangeRate->update(['status' => 'applied']);
            }

            $proposal->update([
                'status' => PriceProposalStatus::Approved,
                'reviewed_by' => $adminId,
                'reviewed_at' => now(),
            ]);
        });

        return $proposal->fresh();
    }

    public function rejectOne(ProductPriceProposal $proposal, int $adminId): ProductPriceProposal
    {
        $this->guardNotFinal($proposal);

        DB::transaction(function () use ($proposal, $adminId) {
            $proposal->update([
                'status' => PriceProposalStatus::Rejected,
                'reviewed_by' => $adminId,
                'reviewed_at' => now(),
            ]);

            $this->markRateRejectedIfBatchFullyRejected($proposal->exchangeRate, $proposal->batch_id);
        });

        return $proposal->fresh();
    }

    public function approveBatch(string $batchId, int $adminId): int
    {
        return $this->reviewBatch($batchId, $adminId, approve: true);
    }

    public function rejectBatch(string $batchId, int $adminId): int
    {
        return $this->reviewBatch($batchId, $adminId, approve: false);
    }

    private function reviewBatch(string $batchId, int $adminId, bool $approve): int
    {
        $count = 0;

        ProductPriceProposal::query()
            ->where('batch_id', $batchId)
            ->whereIn('status', [PriceProposalStatus::PendingReview, PriceProposalStatus::Edited])
            ->chunkById(200, function ($proposals) use ($adminId, $approve, &$count) {
                foreach ($proposals as $proposal) {
                    $approve ? $this->approveOne($proposal, $adminId) : $this->rejectOne($proposal, $adminId);
                    $count++;
                }
            });

        return $count;
    }

    /**
     * Bug fix: previously nothing ever set ExchangeRate::status to
     * 'rejected', so a rate whose entire proposal batch was rejected stayed
     * 'pending_review' forever. ExchangeRateOverrideController::current()/
     * confirmCurrent() both just pick the latest-fetched rate, so that
     * already-rejected rate could later be silently reactivated by an admin
     * clicking "confirm current rate" for an unrelated reason (e.g. to add a
     * new dollar product). Once every proposal in this rate's batch has
     * reached a final state (approved or rejected) and none of them were
     * approved, the rate itself is now marked rejected so it stops being
     * treated as a valid "latest" candidate.
     *
     * If at least one proposal in the batch was approved, the rate is
     * already 'applied' (set in approveOne) and that takes precedence - a
     * rate that partially took effect should never be downgraded to
     * 'rejected'.
     */
    private function markRateRejectedIfBatchFullyRejected(ExchangeRate $rate, string $batchId): void
    {
        if ($rate->status === 'applied') {
            return;
        }

        $stillOpen = ProductPriceProposal::query()
            ->where('batch_id', $batchId)
            ->whereIn('status', [PriceProposalStatus::PendingReview, PriceProposalStatus::Edited])
            ->exists();

        if ($stillOpen) {
            return;
        }

        $hasApproved = ProductPriceProposal::query()
            ->where('batch_id', $batchId)
            ->where('status', PriceProposalStatus::Approved)
            ->exists();

        if (! $hasApproved && $rate->status !== 'rejected') {
            $rate->update(['status' => 'rejected']);
        }
    }

    private function guardNotFinal(ProductPriceProposal $proposal): void
    {
        if ($proposal->status->isFinal()) {
            throw PriceProposalAlreadyReviewedException::alreadyReviewed();
        }
    }
}
```


---

## `app\Services\Pricing\PricingService.php`

```php
<?php

namespace App\Services\Pricing;

use App\Models\ExchangeRate;
use App\Models\Product;

class PricingService
{
    public function computeTomanPrice(Product $product, ExchangeRate $rate): int
    {
        $computed = (int) round(((float) $product->price_usd) * ((float) $rate->rate));
        $current = (int) ($product->price_toman ?? 0);

        return max($computed, $current);
    }

    /**
     * تبدیل مستقیم دلار به تومان، بدون محافظت max() — فقط برای زمانی که
     * خودِ ادمین دستی price_usd رو تغییر می‌ده. محافظت «قیمت هرگز خودکار
     * پایین نیاد» فقط باید برای بازمحاسبه‌ی خودکار هفتگی اعمال بشه.
     */
    public function convertUsdToToman(float $priceUsd, ExchangeRate $rate): int
    {
        return (int) round($priceUsd * (float) $rate->rate);
    }

    public function computeFinalPrice(Product $product): int
    {
        if (! $this->hasActiveDiscount($product)) {
            return $product->price_toman;
        }

        $discounted = $product->discount_type === \App\Enums\DiscountType::Percent
            ? (int) round($product->price_toman * (1 - $product->discount_value / 100))
            : $product->price_toman - $product->discount_value;

        return max(0, min($discounted, $product->price_toman));
    }

    public function hasActiveDiscount(Product $product): bool
    {
        if (! $product->discount_type || ! $product->discount_value) {
            return false;
        }

        $now = now();

        if ($product->discount_starts_at && $now->lt($product->discount_starts_at)) {
            return false;
        }

        if ($product->discount_ends_at && $now->gt($product->discount_ends_at)) {
            return false;
        }

        return true;
    }

    public function assertDiscountValid(?string $discountType, ?int $discountValue, int $priceToman): void
    {
        if (! $discountType || $discountValue === null) {
            return;
        }

        if ($discountValue < 0) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'discount_value' => 'مقدار تخفیف نمی‌تواند منفی باشد.',
            ]);
        }

        if ($discountType === 'percent' && $discountValue > 100) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'discount_value' => 'درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.',
            ]);
        }

        if ($discountType === 'fixed' && $discountValue > $priceToman) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'discount_value' => 'مبلغ تخفیف نمی‌تواند بیشتر از قیمت محصول باشد.',
            ]);
        }
    }
}
```


---

## `app\Services\Product\ProductFilterService.php`

```php
<?php

namespace App\Services\Product;

use App\DTOs\Product\ProductFilterDTO;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ProductFilterService
{
    public function paginate(ProductFilterDTO $filters): LengthAwarePaginator
    {
        $query = Product::query()
            ->active()
            ->with(['category:id,name,slug', 'primaryImage'])
            ->withCount([]);

        $this->applyCategoryFilter($query, $filters);
        $this->applySearchFilter($query, $filters);
        $this->applyPriceFilter($query, $filters);
        $this->applyStockFilter($query, $filters);
        $this->applyDiscountFilter($query, $filters);
        $this->applyFeaturedFilter($query, $filters);
        $this->applySort($query, $filters->sort);

        return $query->paginate($filters->perPage, ['*'], 'page', $filters->page)->withQueryString();
    }

    private function applyCategoryFilter(Builder $query, ProductFilterDTO $filters): void
    {
        if (!$filters->categorySlug) {
            return;
        }

        $category = Category::query()
            ->where('slug', $filters->categorySlug)
            ->first(['id']);

        if (!$category) {
            $query->whereRaw('1 = 0');
            return;
        }

        $categoryIds = $this->collectDescendantIds($category->id);
        $categoryIds[] = $category->id;

        $query->whereIn('category_id', $categoryIds);
    }

    private function collectDescendantIds(int $categoryId): array
    {
        $ids = [];
        $currentLevel = [$categoryId];

        while (!empty($currentLevel)) {
            $children = Category::query()
                ->whereIn('parent_id', $currentLevel)
                ->pluck('id')
                ->toArray();

            $ids = array_merge($ids, $children);
            $currentLevel = $children;
        }

        return $ids;
    }

    private function applySearchFilter(Builder $query, ProductFilterDTO $filters): void
    {
        if (!$filters->search) {
            return;
        }

        // escape کردن wildcard های LIKE - بدون این، % و _ و \ کاربر
        // به‌عنوان کاراکتر خاص SQL تفسیر میشن (نه SQL injection کلاسیک، ولی می‌تونه
        // جستجو رو دستکاری یا کوئری رو غیرمنتظره سنگین کنه)
        $search = $this->escapeLike($filters->search);

        $query->where(function (Builder $q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")
                ->orWhere('short_description', 'like', "%{$search}%");
        });
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    private function applyPriceFilter(Builder $query, ProductFilterDTO $filters): void
    {
        // ستون 'price' با مایگریشن add_usd_pricing_to_products_table به
        // 'price_toman' تغییر نام پیدا کرد؛ این متد قبلاً هنوز 'price' رو
        // کوئری می‌کرد که چون این ستون دیگه در جدول وجود ندارد، هر درخواست
        // با min_price/max_price باعث خطای SQL (500) می‌شد.
        if ($filters->minPrice !== null) {
            $query->where('price_toman', '>=', $filters->minPrice);
        }
        if ($filters->maxPrice !== null) {
            $query->where('price_toman', '<=', $filters->maxPrice);
        }
    }

    private function applyStockFilter(Builder $query, ProductFilterDTO $filters): void
    {
        if ($filters->inStock) {
            $query->inStock();
        }
    }

    private function applyDiscountFilter(Builder $query, ProductFilterDTO $filters): void
    {
        if ($filters->hasDiscount) {
            $query->whereNotNull('discount_type')
                ->where(function (Builder $q) {
                    $q->whereNull('discount_starts_at')->orWhere('discount_starts_at', '<=', now());
                })
                ->where(function (Builder $q) {
                    $q->whereNull('discount_ends_at')->orWhere('discount_ends_at', '>=', now());
                });
        }
    }

    private function applyFeaturedFilter(Builder $query, ProductFilterDTO $filters): void
    {
        if ($filters->isFeatured) {
            $query->where('is_featured', true);
        }
    }

    private function applySort(Builder $query, string $sort): void
    {
        // sort از whitelist ثابت FormRequest میاد، پس امن است که مستقیم map بشه.
        // 'price' اینجا هم به 'price_toman' اصلاح شد (همون دلیل applyPriceFilter).
        match ($sort) {
            'oldest' => $query->oldest(),
            'price_asc' => $query->orderBy('price_toman', 'asc'),
            'price_desc' => $query->orderBy('price_toman', 'desc'),
            'most_purchased' => $query->orderByDesc('purchases_count'),
            'most_liked' => $query->orderByDesc('likes_count'),
            'most_viewed' => $query->orderByDesc('views_count'),
            default => $query->latest(),
        };
    }
}
```


---

## `app\Services\Product\ProductService.php`

```php
<?php

namespace App\Services\Product;

use App\Models\ExchangeRate;
use App\Models\Product;
use App\Services\Media\ProductMediaService;
use App\Services\Pricing\PricingService;
use App\Services\Slug\SlugUniquenessResolver;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductService
{
    private const MAX_FEATURED_PRODUCTS = 12;

    public function __construct(
        private SlugUniquenessResolver $slugResolver,
        private ProductMediaService $mediaService,
        private PricingService $pricingService,
    ) {}

    public function create(array $data, int $userId): Product
    {
        return DB::transaction(function () use ($data, $userId) {
            $meta = $data['meta'] ?? null;
            $tagIds = $data['tag_ids'] ?? [];
            $productData = Arr::except($data, ['meta', 'tag_ids']);

            $productData['slug'] = $this->slugResolver->resolve($data['name'], Product::class);
            $productData['description'] = $this->sanitizeDescription($productData['description'] ?? null);
            $productData['short_description'] = $this->sanitizeDescription($productData['short_description'] ?? null);
            $productData['created_by'] = $userId;
            $productData['updated_by'] = $userId;

            $rate = ExchangeRate::applied()->latest('fetched_at')->first();

            if (! $rate) {
                // بدون نرخ دلار، محصول با قیمت صفر منتشر می‌شد که یعنی عملاً
                // مجانی رو سایت می‌رفت — به‌جای پیش‌فرض ناامن، صریح رد می‌کنیم.
                throw ValidationException::withMessages([
                    'price_usd' => 'نرخ دلار هنوز ثبت نشده؛ امکان ساخت محصول با قیمت‌گذاری دلاری نیست. ابتدا نرخ ارز را به‌روزرسانی کنید.',
                ]);
            }

            $productData['price_toman'] = (int) round($productData['price_usd'] * (float) $rate->rate);

            $this->pricingService->assertDiscountValid(
                $productData['discount_type'] ?? null,
                $productData['discount_value'] ?? null,
                $productData['price_toman']
            );

            $product = Product::create($productData);
            $product->syncMeta($meta);
            $product->syncTags($tagIds);

            return $product->fresh(['tags', 'meta']);
        });
    }

    public function update(Product $product, array $data, int $userId): Product
    {
        return DB::transaction(function () use ($product, $data, $userId) {
            $meta = $data['meta'] ?? null;
            $tagIds = $data['tag_ids'] ?? null;
            $productData = Arr::except($data, ['meta', 'tag_ids']);

            if (isset($productData['name']) && $productData['name'] !== $product->name) {
                $productData['slug'] = $this->slugResolver->resolve($productData['name'], Product::class, $product->id);
            }

            if (array_key_exists('description', $productData)) {
                $productData['description'] = $this->sanitizeDescription($productData['description']);
            }
            if (array_key_exists('short_description', $productData)) {
                $productData['short_description'] = $this->sanitizeDescription($productData['short_description']);
            }

            // اگه قیمت دلاری عوض شد، تومان رو بلافاصله با آخرین نرخ بازمحاسبه کن.
            // اینجا از convertUsdToToman (بدون محافظت max) استفاده می‌کنیم، نه
            // computeTomanPrice — چون این تغییر دستی و آگاهانه‌ی ادمینه، نه
            // بازمحاسبه‌ی خودکار Job هفتگی؛ ادمین باید بتونه قیمت رو هم بالا
            // ببره هم پایین بیاره (مثلاً حراج)، محافظت «هرگز خودکار پایین نیاد»
            // فقط برای نرخ دلار API خارجی معناداره.
            if (isset($productData['price_usd']) && (float) $productData['price_usd'] !== (float) $product->price_usd) {
                $rate = ExchangeRate::applied()->latest('fetched_at')->first();

                if (! $rate) {
                    throw ValidationException::withMessages([
                        'price_usd' => 'نرخ دلار هنوز ثبت نشده؛ امکان محاسبه‌ی قیمت تومانی نیست.',
                    ]);
                }

                $productData['price_toman'] = $this->pricingService->convertUsdToToman(
                    (float) $productData['price_usd'],
                    $rate
                );
            }

            $newDiscountType = $productData['discount_type'] ?? $product->discount_type?->value;
            $newDiscountValue = $productData['discount_value'] ?? $product->discount_value;
            $newPriceToman = $productData['price_toman'] ?? $product->price_toman;

            $this->pricingService->assertDiscountValid($newDiscountType, $newDiscountValue, $newPriceToman);

            $productData['updated_by'] = $userId;
            $product->update($productData);

            if ($tagIds !== null) {
                $product->syncTags($tagIds);
            }
            if (array_key_exists('meta', $data)) {
                $product->syncMeta($meta);
            }

            return $product->fresh(['tags', 'meta']);
        });
    }

    public function delete(Product $product): void
    {
        $product->delete(); // soft delete
    }

    public function toggleFeatured(Product $product): Product
    {
        if (! $product->is_featured) {
            $activeFeaturedCount = Product::query()->where('is_featured', true)->count();

            if ($activeFeaturedCount >= self::MAX_FEATURED_PRODUCTS) {
                throw ValidationException::withMessages([
                    'is_featured' => 'حداکثر '.self::MAX_FEATURED_PRODUCTS.' محصول می‌توانند هم‌زمان ویژه باشند.',
                ]);
            }
        }

        $product->update(['is_featured' => ! $product->is_featured]);

        return $product->fresh();
    }

    /** افزایش بازدید - جدا از cache نمی‌کنیم چون increment در دیتابیس اتمیک و سریع است */
    public function incrementViews(Product $product): void
    {
        $product->increment('views_count');
    }

    public function restore(Product $product): Product
    {
        return DB::transaction(function () use ($product) {
            $product->restore();

            return $product->fresh();
        });
    }

    /**
     * حذف قطعی و برگشت‌ناپذیر. قبل از حذف رکورد، فایل‌های عکس/ویدیوی محصول
     * از روی دیسک پاک می‌شن — cascade سطح دیتابیس فقط ردیف‌های
     * product_images/product_videos رو حذف می‌کنه، نه فایل واقعی روی storage.
     */
    public function forceDelete(Product $product): void
    {
        foreach ($product->images as $image) {
            $this->mediaService->deleteImage($image);
        }

        foreach ($product->videos as $video) {
            $this->mediaService->deleteVideo($video);
        }

        $product->tags()->detach();
        $product->meta()->delete();
        $product->forceDelete();
    }

    /** حذف تگ‌های HTML از توضیحات — ضد XSS ذخیره‌شده، چون description مستقیم نمایش داده می‌شه */
    private function sanitizeDescription(?string $value): ?string
    {
        return $value !== null ? strip_tags($value) : null;
    }
}
```


---

## `database\migrations\2026_08_02_131613_create_products_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();

            $table->string('name', 200);
            $table->string('slug', 230)->unique();
            $table->string('sku', 64)->unique();

            $table->string('short_description', 500)->nullable();
            $table->longText('description')->nullable();

            $table->unsignedBigInteger('price'); // به‌صورت ریال/کوچک‌ترین واحد پول ذخیره می‌شه، نه float
            $table->enum('discount_type', ['percent', 'fixed'])->nullable();
            $table->unsignedBigInteger('discount_value')->nullable();
            $table->timestamp('discount_starts_at')->nullable();
            $table->timestamp('discount_ends_at')->nullable();

            $table->unsignedInteger('stock_quantity')->default(0);
            $table->enum('stock_status', ['in_stock', 'out_of_stock', 'preorder'])->default('in_stock');

            $table->unsignedInteger('weight_grams')->nullable();

            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->unsignedBigInteger('views_count')->default(0);

            $table->string('meta_title', 180)->nullable();
            $table->string('meta_description', 300)->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['category_id', 'is_active']);
            $table->index(['is_featured', 'is_active']);
            $table->index('stock_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
```


---

## `database\migrations\2026_08_02_131614_create_product_images_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('disk', 30)->default('public');
            $table->string('path');
            $table->string('alt_text', 200)->nullable();
            $table->boolean('is_primary')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['product_id', 'is_primary']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_images');
    }
};
```


---

## `database\migrations\2026_08_02_131615_create_product_videos_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();

            // 'upload' = فایل روی دیسک خودمون | 'youtube' | 'aparat' | 'external'
            $table->enum('source_type', ['upload', 'youtube', 'aparat', 'external'])->default('upload');

            // برای upload: مسیر فایل روی دیسک | برای youtube/aparat/external: URL کامل
            $table->string('disk', 30)->nullable();   // فقط وقتی source_type=upload پر می‌شه
            $table->string('path')->nullable();        // فقط وقتی source_type=upload پر می‌شه
            $table->string('external_url')->nullable(); // فقط وقتی youtube/aparat/external پر می‌شه
            $table->string('external_id', 100)->nullable(); // شناسه‌ی ویدیو (مثلاً video_id یوتیوب) برای embed سریع‌تر

            $table->string('thumbnail_path')->nullable();
            $table->string('title', 200)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_videos');
    }
};
```


---

## `database\migrations\2026_08_16_143721_add_usd_pricing_to_products_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 'price' قبلی تومانی بود؛ الان به‌وضوح price_toman صداش می‌کنیم چون
        // دیگه یه فیلد cache‌شده‌ست، نه ورودی مستقیم ادمین.
        Schema::table('products', function (Blueprint $table) {
            $table->renameColumn('price', 'price_toman');
        });

        Schema::table('products', function (Blueprint $table) {
            // منبع حقیقتِ قیمت؛ فقط همین رو ادمین دستی ست می‌کنه.
            $table->decimal('price_usd', 10, 2)->default(0)->after('price_toman');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE products ADD CONSTRAINT products_price_usd_non_negative CHECK (price_usd >= 0)');
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('price_usd');
            $table->renameColumn('price_toman', 'price');
        });
    }
};
```


---

## `database\migrations\2026_08_20_132210_create_product_price_proposals_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_price_proposals', function (Blueprint $table) {
            $table->id();
            // Shared batch_id for every proposal generated from one event
            // (weekly rate check or a manual override) - bulk approve/reject
            // operates on this batch_id.
            $table->uuid('batch_id');
            $table->foreignId('exchange_rate_id')->constrained('exchange_rates')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();

            $table->unsignedBigInteger('old_price_toman');
            $table->unsignedBigInteger('new_price_toman'); // system-computed proposed value
            $table->unsignedBigInteger('edited_price_toman')->nullable(); // admin manual edit before approval

            $table->enum('status', ['pending_review', 'approved', 'rejected', 'edited'])->default('pending_review');

            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();

            $table->unique(['batch_id', 'product_id']);
            $table->index(['status', 'batch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_price_proposals');
    }
};
```


---

## `database\seeders\GrantPricesManualOverridePermissionSeeder.php`

```php
<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

/**
 * One-off seeder: creates the pricing-related permissions (if missing) and
 * grants them to one admin/staff account, identified by email.
 *
 * Grants:
 *  - exchange-rates.manage  (NEW - required by ManualExchangeRateOverrideRequest::authorize(),
 *                             ExchangeRateOverrideController::confirmCurrent()/fetchNow(), and
 *                             ExchangeRateScheduleController; this is now the single dedicated
 *                             permission for the whole "exchange rate management" side, fully
 *                             separate from product price review)
 *  - prices.review          (required by ProductPriceProposalPolicy::viewAny(), to view/approve/
 *                             reject product price proposals - the "product price update" side)
 *  - prices.manual_override (legacy - kept granted for backward compatibility with any code that
 *                             still checks it, but the override endpoint itself now checks
 *                             exchange-rates.manage instead)
 *
 * Usage:
 *   GRANT_PRICING_PERMS_TO_EMAIL=admin@example.com php artisan db:seed \
 *     --class=GrantPricesManualOverridePermissionSeeder
 *
 * Or edit the fallback email below and run without the env var.
 */
class GrantPricesManualOverridePermissionSeeder extends Seeder
{
    private const PERMISSION_NAMES = [
        'exchange-rates.manage',
        'prices.review',
        'prices.manual_override',
    ];

    public function run(): void
    {
        $adminEmail = env('GRANT_PRICING_PERMS_TO_EMAIL', 'ADMIN_EMAIL_HERE');

        $user = User::where('email', $adminEmail)->first();

        if (! $user) {
            $this->command?->error("No user found with email {$adminEmail}; permissions were created (if missing) but not granted to anyone.");
        }

        foreach (self::PERMISSION_NAMES as $name) {
            // The permission's guard_name must match User::$guard_name ('sanctum').
            // A permission created with the default 'web' guard would silently
            // never match $user->can(...) on this app.
            $permission = Permission::firstOrCreate([
                'name' => $name,
                'guard_name' => 'sanctum',
            ]);

            if (! $user) {
                continue;
            }

            if ($user->hasPermissionTo($permission)) {
                $this->command?->info("{$adminEmail} already has {$name}.");
                continue;
            }

            $user->givePermissionTo($permission);
            $this->command?->info("Granted {$name} to {$adminEmail}.");
        }
    }
}
```


---

## `database\seeders\RolePermissionSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'products.view', 'products.create', 'products.update', 'products.delete', 'products.manage', 'products.trash',
            'categories.view', 'categories.create', 'categories.update', 'categories.delete', 'categories.manage', 'categories.trash',
            'orders.view', 'orders.update', 'orders.delete',
            'users.view', 'users.manage',
            'audit-logs.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'sanctum']);
        }

        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'sanctum']);
        $manager->syncPermissions([
            'products.view', 'products.create', 'products.update',
            'categories.view', 'categories.create', 'categories.update',
            'orders.view', 'orders.update',
        ]);

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $admin->syncPermissions(Permission::all());
    }
}
```


---

## `routes\api.php`

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\TokenController;

/*
|--------------------------------------------------------------------------
| API Routes - V1
|--------------------------------------------------------------------------
*/

// Token refresh route: authenticated via httpOnly cookie (not a Bearer header).
// verify.origin protects this endpoint against CSRF-style abuse.
Route::middleware(['verify.origin', 'throttle:10,1'])->group(function () {
    Route::post('v1/auth/refresh', [TokenController::class, 'refresh']);
});

// Include per-resource route files.
Route::prefix('v1/auth/customer')->group(base_path('routes/api/v1/customer_auth.php'));
Route::prefix('v1/auth/staff')->group(base_path('routes/api/v1/staff_auth.php'));
Route::prefix('v1/categories')->group(base_path('routes/api/v1/categories.php'));
Route::prefix('v1/products')->group(base_path('routes/api/v1/products.php'));

// بررسی و تایید پیشنهادهای قیمت محصولات (سمت «به‌روزرسانی قیمت محصولات»).
// مسیرهای خودرا به‌صورت کامل (admin/prices/*) داخل pricing.php دارند.
Route::prefix('v1')->group(base_path('routes/api/v1/pricing.php'));

// مدیریت نرخ ارز (سمت «قیمت ارز») - کاملاً مجزا از pricing.php طبق تصمیم
// تایید‌شده. مسیرهای خودرا به‌صورت کامل (admin/exchange-rates/*) داخل
// exchange-rates.php دارند - مطابق با BASE جدید frontend که باید pricingApi.ts را به
// این مسیر اشاره دهد.
Route::prefix('v1')->group(base_path('routes/api/v1/exchange-rates.php'));
```


---

## `routes\api\v1\products.php`

```php
<?php

use App\Http\Controllers\Api\V1\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\V1\Admin\ProductMediaController;
use App\Http\Controllers\Api\V1\Public\ProductController as PublicProductController;
use Illuminate\Support\Facades\Route;


// ============================================================
// ADMIN
// ============================================================

Route::middleware([
    'auth:sanctum',
    'staff.access',
    'account.active',
])
    ->prefix('admin')
    ->group(function () {

        Route::get('/', [AdminProductController::class, 'index']);
        Route::post('/', [AdminProductController::class, 'store']);

        // Trash
        Route::get('trash', [AdminProductController::class, 'trash']);

        Route::post(
            '{id}/restore',
            [AdminProductController::class, 'restore']
        )->whereNumber('id');

        Route::delete(
            '{id}/force',
            [AdminProductController::class, 'forceDestroy']
        )->whereNumber('id');


        // Product
        Route::get('{product}', [AdminProductController::class, 'show']);

        Route::patch(
            '{product}',
            [AdminProductController::class, 'update']
        );

        Route::delete(
            '{product}',
            [AdminProductController::class, 'destroy']
        );

        Route::patch(
            '{product}/toggle-featured',
            [AdminProductController::class, 'toggleFeatured']
        );


        // Images
        Route::post(
            '{product}/images',
            [ProductMediaController::class, 'storeImages']
        );

        Route::patch(
            '{product}/images/{image}/primary',
            [ProductMediaController::class, 'setPrimaryImage']
        );

        Route::delete(
            '{product}/images/{image}',
            [ProductMediaController::class, 'destroyImage']
        );


        // Videos
        Route::post(
            '{product}/videos',
            [ProductMediaController::class, 'storeVideo']
        );

        Route::delete(
            '{product}/videos/{video}',
            [ProductMediaController::class, 'destroyVideo']
        );
    });


// ============================================================
// PUBLIC
// ============================================================

// عمومی — فقط خواندن، با throttle در برابر scraping / DoS
Route::middleware('throttle:60,1')->group(function () {

    Route::get(
        'featured',
        [PublicProductController::class, 'featured']
    );

    Route::get(
        '/',
        [PublicProductController::class, 'index']
    );

    Route::get(
        '{slug}',
        [PublicProductController::class, 'show']
    );
});
```

