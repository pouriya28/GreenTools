## C:\Dev\GreenTools\apibackendlaravel\app\DTOs\Product\ProductFilterDTO.php — Line 3

``php
namespace App\DTOs\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\DTOs\Product\ProductFilterDTO.php — Line 5

``php
final class ProductFilterDTO
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaNotFoundException.php — Line 3

``php
namespace App\Exceptions\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaNotFoundException.php — Line 9

``php
 * برمی‌گردونیم (نه ۴۲۲/۴۰۳) تا با رفتار ProductMediaController::destroyImage/
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaNotFoundException.php — Line 12

``php
class ProductMediaNotFoundException extends ApiException
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaNotFoundException.php — Line 22

``php
    public static function imageNotOwnedByProduct(): self
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaNotFoundException.php — Line 25

``php
            'PRODUCT_IMAGE_NOT_FOUND',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaNotFoundException.php — Line 27

``php
            'Image does not belong to the given product.',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaNotFoundException.php — Line 31

``php
    public static function videoNotOwnedByProduct(): self
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaNotFoundException.php — Line 34

``php
            'PRODUCT_VIDEO_NOT_FOUND',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaNotFoundException.php — Line 36

``php
            'Video does not belong to the given product.',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaValidationException.php — Line 3

``php
namespace App\Exceptions\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaValidationException.php — Line 13

``php
class ProductMediaValidationException extends ApiException
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaValidationException.php — Line 26

``php
            'PRODUCT_MEDIA_TOO_MANY_IMAGES',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaValidationException.php — Line 35

``php
            'PRODUCT_MEDIA_IMAGE_TOO_LARGE',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaValidationException.php — Line 44

``php
            'PRODUCT_MEDIA_INVALID_IMAGE',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaValidationException.php — Line 53

``php
            'PRODUCT_MEDIA_TOO_MANY_VIDEOS',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaValidationException.php — Line 55

``php
            'Too many videos for this product.',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaValidationException.php — Line 62

``php
            'PRODUCT_MEDIA_VIDEO_FILE_MISSING',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaValidationException.php — Line 71

``php
            'PRODUCT_MEDIA_VIDEO_TOO_LARGE',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Exceptions\Product\ProductMediaValidationException.php — Line 80

``php
            'PRODUCT_MEDIA_INVALID_VIDEO',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 8

``php
use App\Http\Resources\ProductPriceProposalResource;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 9

``php
use App\Models\ProductPriceProposal;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 27

``php
        $this->authorize('viewAny', ProductPriceProposal::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 29

``php
        $batchId = $request->query('batch_id') ?? ProductPriceProposal::query()->latest('id')->value('batch_id');
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 32

``php
            return ProductPriceProposalResource::collection(collect());
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 35

``php
        $proposals = ProductPriceProposal::query()
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 37

``php
            ->with('product:id,name,sku')
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 41

``php
        return ProductPriceProposalResource::collection($proposals);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 47

``php
        $this->authorize('viewAny', ProductPriceProposal::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 57

``php
    public function update(UpdatePriceProposalRequest $request, ProductPriceProposal $proposal)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 67

``php
        return new ProductPriceProposalResource($proposal);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 70

``php
    public function approve(Request $request, ProductPriceProposal $proposal)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 72

``php
        $this->authorize('review', ProductPriceProposal::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 77

``php
        return new ProductPriceProposalResource($proposal);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 80

``php
    public function reject(Request $request, ProductPriceProposal $proposal)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 82

``php
        $this->authorize('review', ProductPriceProposal::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 87

``php
        return new ProductPriceProposalResource($proposal);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 92

``php
        $this->authorize('review', ProductPriceProposal::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 101

``php
        $this->authorize('review', ProductPriceProposal::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\PriceProposalController.php — Line 108

``php
    private function guardNotFinal(ProductPriceProposal $proposal): void
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 6

``php
use App\Http\Requests\Api\V1\Product\AdminProductIndexRequest;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 7

``php
use App\Http\Requests\Api\V1\Product\StoreProductRequest;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 8

``php
use App\Http\Requests\Api\V1\Product\UpdateProductRequest;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 9

``php
use App\Http\Resources\ProductListResource;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 10

``php
use App\Http\Resources\ProductResource;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 11

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 12

``php
use App\Services\Product\ProductService;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 15

``php
class ProductController extends Controller
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 17

``php
    public function __construct(private ProductService $productService) {}
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 20

``php
     * لیست مدیریتی محصولات، صفحه‌بندی‌شده. برخلاف ProductFilterService
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 24

``php
    public function index(AdminProductIndexRequest $request)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 29

``php
        $products = Product::query()
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 42

``php
            // ستون 'price' با مایگریشن add_usd_pricing_to_products_table به
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 51

``php
        return ProductListResource::collection($products);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 54

``php
    public function show(Product $product)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 56

``php
        $this->authorize('view', Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 58

``php
        return new ProductResource($product->load(['category', 'images', 'videos']));
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 61

``php
    public function store(StoreProductRequest $request)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 63

``php
        $product = $this->productService->create($request->validated(), $request->user()->id);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 65

``php
        return (new ProductResource($product))->response()->setStatusCode(201);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 68

``php
    public function update(UpdateProductRequest $request, Product $product)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 70

``php
        $product = $this->productService->update($product, $request->validated(), $request->user()->id);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 72

``php
        return new ProductResource($product->load(['category', 'images', 'videos']));
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 75

``php
    public function destroy(Product $product)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 77

``php
        $this->authorize('manage', Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 79

``php
        $this->productService->delete($product);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 84

``php
    public function toggleFeatured(Product $product)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 86

``php
        $this->authorize('manage', Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 88

``php
        $product = $this->productService->toggleFeatured($product);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 90

``php
        return new ProductResource($product);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 96

``php
        $this->authorize('viewTrash', Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 98

``php
        $products = Product::onlyTrashed()
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 103

``php
        return ProductListResource::collection($products);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 112

``php
        $this->authorize('restore', Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 114

``php
        $product = Product::onlyTrashed()->findOrFail($id);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 115

``php
        $product = $this->productService->restore($product);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 117

``php
        return new ProductResource($product);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 123

``php
        $this->authorize('forceDelete', Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 125

``php
        $product = Product::onlyTrashed()->findOrFail($id);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductController.php — Line 126

``php
        $this->productService->forceDelete($product);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 6

``php
use App\Http\Requests\Api\V1\Product\StoreProductImageRequest;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 7

``php
use App\Http\Requests\Api\V1\Product\StoreProductVideoRequest;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 8

``php
use App\Http\Resources\ProductImageResource;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 9

``php
use App\Http\Resources\ProductVideoResource;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 10

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 11

``php
use App\Models\ProductImage;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 12

``php
use App\Models\ProductVideo;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 13

``php
use App\Services\Media\ProductMediaService;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 15

``php
class ProductMediaController extends Controller
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 17

``php
    public function __construct(private ProductMediaService $mediaService) {}
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 19

``php
    public function storeImages(StoreProductImageRequest $request, Product $product)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 23

``php
        // on StoreProductImageRequest::authorize(), a file not present in
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 25

``php
        $this->authorize('manage', Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 28

``php
            $product,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 33

``php
        return ProductImageResource::collection($images);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 36

``php
    public function setPrimaryImage(Product $product, ProductImage $image)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 38

``php
        $this->authorize('manage', Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 40

``php
        $this->mediaService->setPrimaryImage($product, $image);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 45

``php
    public function destroyImage(Product $product, ProductImage $image)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 47

``php
        $this->authorize('manage', Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 49

``php
        if ($image->product_id !== $product->id) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 58

``php
    public function storeVideo(StoreProductVideoRequest $request, Product $product)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 61

``php
        $this->authorize('manage', Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 64

``php
        // storeVideo(). For source_type=upload, ProductMediaService::storeVideo()
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 66

``php
        // ProductMediaValidationException::videoFileMissing(), so uploaded
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 70

``php
            $product,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 75

``php
        return (new ProductVideoResource($video))->response()->setStatusCode(201);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 78

``php
    public function destroyVideo(Product $product, ProductVideo $video)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 80

``php
        $this->authorize('manage', Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Admin\ProductMediaController.php — Line 82

``php
        if ($video->product_id !== $product->id) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 5

``php
use App\DTOs\Product\ProductFilterDTO;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 7

``php
use App\Http\Requests\Api\V1\Product\ProductIndexRequest;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 8

``php
use App\Http\Resources\ProductListResource;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 9

``php
use App\Http\Resources\ProductResource;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 10

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 11

``php
use App\Services\Product\ProductFilterService;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 12

``php
use App\Services\Product\ProductService;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 15

``php
class ProductController extends Controller
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 18

``php
        private ProductFilterService $filterService,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 19

``php
        private ProductService $productService,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 22

``php
    public function index(ProductIndexRequest $request)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 24

``php
        $filters = ProductFilterDTO::fromArray($request->validated());
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 25

``php
        $products = $this->filterService->paginate($filters);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 27

``php
        return ProductListResource::collection($products);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 33

``php
        $filters = ProductFilterDTO::fromArray([
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 40

``php
        $products = $this->filterService->paginate($filters);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 42

``php
        return ProductListResource::collection($products);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 47

``php
     * routes/api/v1/products.php روی 'GET {slug}' رجیستر شده بود؛ یعنی هر
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 54

``php
        $product = Product::query()
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 60

``php
        $this->productService->incrementViews($product);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Controllers\Api\V1\Public\ProductController.php — Line 62

``php
        return new ProductResource($product);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\AdminProductIndexRequest.php — Line 3

``php
namespace App\Http\Requests\Api\V1\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\AdminProductIndexRequest.php — Line 5

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\AdminProductIndexRequest.php — Line 8

``php
class AdminProductIndexRequest extends FormRequest
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\AdminProductIndexRequest.php — Line 12

``php
        return $this->user()?->can('viewAny', Product::class) ?? false;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\AdminProductIndexRequest.php — Line 23

``php
            // برای همین از ProductFilterService (که ->active() رو اجباری می‌کنه) استفاده نمی‌کنیم
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\ProductIndexRequest.php — Line 3

``php
namespace App\Http\Requests\Api\V1\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\ProductIndexRequest.php — Line 7

``php
class ProductIndexRequest extends FormRequest
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\StoreProductImageRequest.php — Line 3

``php
namespace App\Http\Requests\Api\V1\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\StoreProductImageRequest.php — Line 5

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\StoreProductImageRequest.php — Line 8

``php
class StoreProductImageRequest extends FormRequest
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\StoreProductImageRequest.php — Line 12

``php
        return $this->user()?->can('manage', Product::class) ?? false;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\StoreProductRequest.php — Line 3

``php
namespace App\Http\Requests\Api\V1\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\StoreProductRequest.php — Line 5

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\StoreProductRequest.php — Line 8

``php
class StoreProductRequest extends FormRequest
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\StoreProductRequest.php — Line 12

``php
        return $this->user()?->can('create', Product::class) ?? false;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\StoreProductRequest.php — Line 20

``php
            'sku' => ['required', 'string', 'max:64', 'unique:products,sku', 'alpha_dash'],
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\StoreProductVideoRequest.php — Line 3

``php
namespace App\Http\Requests\Api\V1\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\StoreProductVideoRequest.php — Line 5

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\StoreProductVideoRequest.php — Line 8

``php
class StoreProductVideoRequest extends FormRequest
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\StoreProductVideoRequest.php — Line 17

``php
        return $this->user()?->can('manage', Product::class) ?? false;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\UpdateProductRequest.php — Line 3

``php
namespace App\Http\Requests\Api\V1\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\UpdateProductRequest.php — Line 5

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\UpdateProductRequest.php — Line 9

``php
class UpdateProductRequest extends FormRequest
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\UpdateProductRequest.php — Line 13

``php
        return $this->user()?->can('manage', Product::class) ?? false;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\UpdateProductRequest.php — Line 18

``php
        /** @var Product $product */
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\UpdateProductRequest.php — Line 19

``php
        $product = $this->route('product');
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\UpdateProductRequest.php — Line 26

``php
                Rule::unique('products', 'sku')->ignore($product->id),
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\UpdateProductRequest.php — Line 32

``php
            // مایگریشن price -> price_toman دیگه اصلاً به ProductService نمی‌رسید
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\UpdateProductRequest.php — Line 33

``php
            // (چون ProductService::update فقط دنبال price_usd می‌گردد)؛ یعنی این
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Requests\Api\V1\Product\UpdateProductRequest.php — Line 35

``php
            // مثل StoreProductRequest، فقط price_usd می‌گیریم؛ price_toman توسط
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductImageResource.php — Line 8

``php
class ProductImageResource extends JsonResource
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductListResource.php — Line 8

``php
class ProductListResource extends JsonResource
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductListResource.php — Line 17

``php
            // اصلاً sku را برنمی‌گرداند (فقط ProductResource کامل آن را داشت).
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductListResource.php — Line 20

``php
            // ستون دیتابیس با مایگریشن add_usd_pricing_to_products_table از
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductListResource.php — Line 42

``php
                fn () => $this->primaryImage ? new ProductImageResource($this->primaryImage) : null
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductPriceProposalResource.php — Line 8

``php
class ProductPriceProposalResource extends JsonResource
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductPriceProposalResource.php — Line 15

``php
            'product' => [
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductPriceProposalResource.php — Line 16

``php
                'id' => $this->product->id,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductPriceProposalResource.php — Line 17

``php
                'name' => $this->product->name,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductPriceProposalResource.php — Line 18

``php
                'sku' => $this->product->sku,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductResource.php — Line 8

``php
class ProductResource extends JsonResource
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductResource.php — Line 20

``php
            // مثل ProductListResource: ستون دیتابیس به 'price_toman' تغییر نام
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductResource.php — Line 50

``php
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductResource.php — Line 51

``php
            'videos' => ProductVideoResource::collection($this->whenLoaded('videos')),
``
## C:\Dev\GreenTools\apibackendlaravel\app\Http\Resources\ProductVideoResource.php — Line 8

``php
class ProductVideoResource extends JsonResource
``
## C:\Dev\GreenTools\apibackendlaravel\app\Jobs\RecalculateProductPricesJob.php — Line 6

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Jobs\RecalculateProductPricesJob.php — Line 16

``php
class RecalculateProductPricesJob implements ShouldQueue
``
## C:\Dev\GreenTools\apibackendlaravel\app\Jobs\RecalculateProductPricesJob.php — Line 34

``php
        Product::query()
``
## C:\Dev\GreenTools\apibackendlaravel\app\Jobs\RecalculateProductPricesJob.php — Line 36

``php
            ->chunkById(200, function ($products) use ($pricingService, $rate, &$updated) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Jobs\RecalculateProductPricesJob.php — Line 37

``php
                DB::transaction(function () use ($products, $pricingService, $rate, &$updated) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Jobs\RecalculateProductPricesJob.php — Line 38

``php
                    foreach ($products as $product) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Jobs\RecalculateProductPricesJob.php — Line 39

``php
                        $newPrice = $pricingService->computeTomanPrice($product, $rate);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Jobs\RecalculateProductPricesJob.php — Line 41

``php
                        if ($newPrice !== $product->price_toman) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Jobs\RecalculateProductPricesJob.php — Line 42

``php
                            $product->update(['price_toman' => $newPrice]);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Jobs\RefreshExchangeRateJob.php — Line 34

``php
     * نمی‌دهد (RecalculateProductPricesJob دیگر از اینجا dispatch نمی‌شود).
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\Category.php — Line 57

``php
    public function products(): HasMany
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\Category.php — Line 59

``php
        return $this->hasMany(Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\ExchangeRate.php — Line 48

``php
        return $this->hasMany(ProductPriceProposal::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\Product.php — Line 14

``php
class Product extends Model
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\Product.php — Line 48

``php
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\Product.php — Line 53

``php
        return $this->hasMany(ProductVideo::class)->orderBy('sort_order');
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\Product.php — Line 58

``php
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\ProductImage.php — Line 9

``php
class ProductImage extends Model
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\ProductImage.php — Line 11

``php
    protected $fillable = ['product_id', 'disk', 'path', 'alt_text', 'is_primary', 'sort_order'];
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\ProductImage.php — Line 15

``php
    public function product(): BelongsTo
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\ProductImage.php — Line 17

``php
        return $this->belongsTo(Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\ProductPriceProposal.php — Line 9

``php
class ProductPriceProposal extends Model
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\ProductPriceProposal.php — Line 12

``php
        'batch_id', 'exchange_rate_id', 'product_id',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\ProductPriceProposal.php — Line 25

``php
    public function product(): BelongsTo
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\ProductPriceProposal.php — Line 27

``php
        return $this->belongsTo(Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\ProductVideo.php — Line 9

``php
class ProductVideo extends Model
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\ProductVideo.php — Line 11

``php
    protected $fillable = ['product_id', 'disk', 'path', 'thumbnail_path', 'title', 'sort_order'];
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\ProductVideo.php — Line 13

``php
    public function product(): BelongsTo
``
## C:\Dev\GreenTools\apibackendlaravel\app\Models\ProductVideo.php — Line 15

``php
        return $this->belongsTo(Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Policies\ProductPolicy.php — Line 7

``php
class ProductPolicy
``
## C:\Dev\GreenTools\apibackendlaravel\app\Policies\ProductPolicy.php — Line 17

``php
            && ($user->can("products.{$ability}") || $user->can('products.manage'));
``
## C:\Dev\GreenTools\apibackendlaravel\app\Policies\ProductPolicy.php — Line 23

``php
        return $this->isEligibleStaff($user) && $user->can('products.trash');
``
## C:\Dev\GreenTools\apibackendlaravel\app\Policies\ProductPolicy.php — Line 44

``php
        return $this->isEligibleStaff($user) && $user->can('products.manage');
``
## C:\Dev\GreenTools\apibackendlaravel\app\Policies\ProductPriceProposalPolicy.php — Line 7

``php
class ProductPriceProposalPolicy
``
## C:\Dev\GreenTools\apibackendlaravel\app\Policies\ProductPriceProposalPolicy.php — Line 9

``php
    // باگ امنیتی واقعی (همون الگویی که در ProductPolicy هم وجود دارد): این مقدار
``
## C:\Dev\GreenTools\apibackendlaravel\app\Policies\ProductPriceProposalPolicy.php — Line 23

``php
    // products.manage، چون تایید انبوه‌ی قیمت‌ها حساس‌تره از ویرایش یک محصوله. پیش‌فرض:
``
## C:\Dev\GreenTools\apibackendlaravel\app\Providers\AppServiceProvider.php — Line 6

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Providers\AppServiceProvider.php — Line 9

``php
use App\Policies\ProductPolicy;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Providers\AppServiceProvider.php — Line 37

``php
        Gate::policy(Product::class, ProductPolicy::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Providers\AppServiceProvider.php — Line 49

``php
            'product' => Product::class,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Category\CategoryService.php — Line 171

``php
            if ($category->products()->exists()) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Category\CategoryService.php — Line 234

``php
            if ($category->products()->exists()) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 5

``php
use App\Exceptions\Product\ProductMediaNotFoundException;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 6

``php
use App\Exceptions\Product\ProductMediaValidationException;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 7

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 8

``php
use App\Models\ProductImage;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 9

``php
use App\Models\ProductVideo;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 15

``php
class ProductMediaService
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 18

``php
    private const IMAGE_DIR_PREFIX = 'products/images';
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 19

``php
    private const VIDEO_DIR_PREFIX = 'products/videos';
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 21

``php
    // همون محدودیت‌های StoreProductImageRequest - اینجا هم اجرا میشن چون پنل ادمین از اون FormRequest رد نمیشه
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 26

``php
    private const MAX_VIDEOS_PER_PRODUCT = 5;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 34

``php
    public function storeImages(Product $product, array $files, array $altTexts = []): array
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 37

``php
            throw ProductMediaValidationException::tooManyImages(self::MAX_IMAGES_PER_UPLOAD);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 47

``php
        return DB::transaction(function () use ($product, $files, $altTexts) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 49

``php
            $hasPrimaryAlready = $product->images()->where('is_primary', true)->exists();
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 50

``php
            $nextSortOrder = (int) $product->images()->max('sort_order') + 1;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 53

``php
                $path = $this->storeSecurely($file, $product->id);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 55

``php
                $created[] = ProductImage::create([
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 56

``php
                    'product_id' => $product->id,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 72

``php
            throw ProductMediaValidationException::imageTooLarge((int) (self::MAX_IMAGE_SIZE_KB / 1024));
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 78

``php
            throw ProductMediaValidationException::invalidImage();
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 82

``php
    private function storeSecurely(UploadedFile $file, int $productId): string
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 96

``php
        $directory = self::IMAGE_DIR_PREFIX."/{$productId}";
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 101

``php
    public function setPrimaryImage(Product $product, ProductImage $image): void
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 103

``php
        if ($image->product_id !== $product->id) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 104

``php
            throw ProductMediaNotFoundException::imageNotOwnedByProduct();
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 107

``php
        DB::transaction(function () use ($product, $image) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 108

``php
            $product->images()->where('is_primary', true)->update(['is_primary' => false]);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 113

``php
    public function deleteImage(ProductImage $image): void
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 116

``php
        $productId = $image->product_id;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 125

``php
        DB::transaction(function () use ($image, $wasPrimary, $productId) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 129

``php
                ProductImage::query()
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 130

``php
                    ->where('product_id', $productId)
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 140

``php
    public function storeVideo(Product $product, array $data, ?UploadedFile $file = null): ProductVideo
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 142

``php
        if ($product->videos()->count() >= self::MAX_VIDEOS_PER_PRODUCT) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 143

``php
            throw ProductMediaValidationException::tooManyVideos(self::MAX_VIDEOS_PER_PRODUCT);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 150

``php
        return DB::transaction(function () use ($product, $data, $file) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 152

``php
                'product_id' => $product->id,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 155

``php
                'sort_order' => (int) $product->videos()->max('sort_order') + 1,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 160

``php
                    throw ProductMediaValidationException::videoFileMissing();
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 163

``php
                [$disk, $path] = $this->storeVideoFile($file, $product->id);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 171

``php
            return ProductVideo::create($payload);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 178

``php
            throw ProductMediaValidationException::videoTooLarge((int) (self::MAX_VIDEO_SIZE_KB / 1024));
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 185

``php
            throw ProductMediaValidationException::invalidVideo();
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 189

``php
    private function storeVideoFile(UploadedFile $file, int $productId): array
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 198

``php
        $directory = self::VIDEO_DIR_PREFIX."/{$productId}";
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Media\ProductMediaService.php — Line 205

``php
    public function deleteVideo(ProductVideo $video): void
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalCsvExporter.php — Line 5

``php
use App\Models\ProductPriceProposal;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalCsvExporter.php — Line 17

``php
        fputcsv($handle, ['product_id', 'sku', 'name', 'old_price_toman', 'new_price_toman', 'effective_price_toman', 'status']);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalCsvExporter.php — Line 19

``php
        ProductPriceProposal::query()
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalCsvExporter.php — Line 21

``php
            ->with('product:id,name,sku')
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalCsvExporter.php — Line 26

``php
                        $proposal->product_id,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalCsvExporter.php — Line 27

``php
                        $proposal->product->sku ?? '',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalCsvExporter.php — Line 28

``php
                        $proposal->product->name ?? '',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 8

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 9

``php
use App\Models\ProductPriceProposal;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 18

``php
     * برای همه‌ی محصولات دلاری (price_usd > 0) یک ProductPriceProposal
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 29

``php
        Product::query()
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 31

``php
            ->chunkById(200, function ($products) use ($rate, $batchId) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 32

``php
                DB::transaction(function () use ($products, $rate, $batchId) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 33

``php
                    foreach ($products as $product) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 38

``php
                        $newPrice = $this->pricingService->computeTomanPrice($product, $rate);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 40

``php
                        ProductPriceProposal::create([
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 43

``php
                            'product_id' => $product->id,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 44

``php
                            'old_price_toman' => $product->price_toman,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 55

``php
    public function editProposedValue(ProductPriceProposal $proposal, int $newPriceToman, int $adminId): ProductPriceProposal
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 67

``php
    public function approveOne(ProductPriceProposal $proposal, int $adminId): ProductPriceProposal
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 72

``php
            $product = $proposal->product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 75

``php
            // همون چک تخفیفی که ProductService::update قبل از هر تغییر قیمت
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 79

``php
                $product->discount_type?->value,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 80

``php
                $product->discount_value,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 84

``php
            $product->update(['price_toman' => $effectivePrice]);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 107

``php
    public function rejectOne(ProductPriceProposal $proposal, int $adminId): ProductPriceProposal
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 138

``php
        ProductPriceProposal::query()
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 158

``php
     * new dollar product). Once every proposal in this rate's batch has
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 174

``php
        $stillOpen = ProductPriceProposal::query()
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 183

``php
        $hasApproved = ProductPriceProposal::query()
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PriceProposalService.php — Line 193

``php
    private function guardNotFinal(ProductPriceProposal $proposal): void
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 6

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 10

``php
    public function computeTomanPrice(Product $product, ExchangeRate $rate): int
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 12

``php
        $computed = (int) round(((float) $product->price_usd) * ((float) $rate->rate));
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 13

``php
        $current = (int) ($product->price_toman ?? 0);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 28

``php
    public function computeFinalPrice(Product $product): int
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 30

``php
        if (! $this->hasActiveDiscount($product)) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 31

``php
            return $product->price_toman;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 34

``php
        $discounted = $product->discount_type === \App\Enums\DiscountType::Percent
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 35

``php
            ? (int) round($product->price_toman * (1 - $product->discount_value / 100))
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 36

``php
            : $product->price_toman - $product->discount_value;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 38

``php
        return max(0, min($discounted, $product->price_toman));
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 41

``php
    public function hasActiveDiscount(Product $product): bool
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 43

``php
        if (! $product->discount_type || ! $product->discount_value) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 49

``php
        if ($product->discount_starts_at && $now->lt($product->discount_starts_at)) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Pricing\PricingService.php — Line 53

``php
        if ($product->discount_ends_at && $now->gt($product->discount_ends_at)) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductFilterService.php — Line 3

``php
namespace App\Services\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductFilterService.php — Line 5

``php
use App\DTOs\Product\ProductFilterDTO;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductFilterService.php — Line 7

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductFilterService.php — Line 11

``php
class ProductFilterService
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductFilterService.php — Line 13

``php
    public function paginate(ProductFilterDTO $filters): LengthAwarePaginator
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductFilterService.php — Line 15

``php
        $query = Product::query()
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductFilterService.php — Line 31

``php
    private function applyCategoryFilter(Builder $query, ProductFilterDTO $filters): void
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductFilterService.php — Line 70

``php
    private function applySearchFilter(Builder $query, ProductFilterDTO $filters): void
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductFilterService.php — Line 93

``php
    private function applyPriceFilter(Builder $query, ProductFilterDTO $filters): void
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductFilterService.php — Line 95

``php
        // ستون 'price' با مایگریشن add_usd_pricing_to_products_table به
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductFilterService.php — Line 107

``php
    private function applyStockFilter(Builder $query, ProductFilterDTO $filters): void
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductFilterService.php — Line 114

``php
    private function applyDiscountFilter(Builder $query, ProductFilterDTO $filters): void
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductFilterService.php — Line 127

``php
    private function applyFeaturedFilter(Builder $query, ProductFilterDTO $filters): void
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 3

``php
namespace App\Services\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 6

``php
use App\Models\Product;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 7

``php
use App\Services\Media\ProductMediaService;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 14

``php
class ProductService
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 16

``php
    private const MAX_FEATURED_PRODUCTS = 12;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 20

``php
        private ProductMediaService $mediaService,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 24

``php
    public function create(array $data, int $userId): Product
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 29

``php
            $productData = Arr::except($data, ['meta', 'tag_ids']);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 31

``php
            $productData['slug'] = $this->slugResolver->resolve($data['name'], Product::class);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 32

``php
            $productData['description'] = $this->sanitizeDescription($productData['description'] ?? null);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 33

``php
            $productData['short_description'] = $this->sanitizeDescription($productData['short_description'] ?? null);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 34

``php
            $productData['created_by'] = $userId;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 35

``php
            $productData['updated_by'] = $userId;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 47

``php
            $productData['price_toman'] = (int) round($productData['price_usd'] * (float) $rate->rate);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 50

``php
                $productData['discount_type'] ?? null,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 51

``php
                $productData['discount_value'] ?? null,
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 52

``php
                $productData['price_toman']
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 55

``php
            $product = Product::create($productData);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 56

``php
            $product->syncMeta($meta);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 57

``php
            $product->syncTags($tagIds);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 59

``php
            return $product->fresh(['tags', 'meta']);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 63

``php
    public function update(Product $product, array $data, int $userId): Product
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 65

``php
        return DB::transaction(function () use ($product, $data, $userId) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 68

``php
            $productData = Arr::except($data, ['meta', 'tag_ids']);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 70

``php
            if (isset($productData['name']) && $productData['name'] !== $product->name) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 71

``php
                $productData['slug'] = $this->slugResolver->resolve($productData['name'], Product::class, $product->id);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 74

``php
            if (array_key_exists('description', $productData)) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 75

``php
                $productData['description'] = $this->sanitizeDescription($productData['description']);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 77

``php
            if (array_key_exists('short_description', $productData)) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 78

``php
                $productData['short_description'] = $this->sanitizeDescription($productData['short_description']);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 87

``php
            if (isset($productData['price_usd']) && (float) $productData['price_usd'] !== (float) $product->price_usd) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 96

``php
                $productData['price_toman'] = $this->pricingService->convertUsdToToman(
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 97

``php
                    (float) $productData['price_usd'],
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 102

``php
            $newDiscountType = $productData['discount_type'] ?? $product->discount_type?->value;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 103

``php
            $newDiscountValue = $productData['discount_value'] ?? $product->discount_value;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 104

``php
            $newPriceToman = $productData['price_toman'] ?? $product->price_toman;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 108

``php
            $productData['updated_by'] = $userId;
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 109

``php
            $product->update($productData);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 112

``php
                $product->syncTags($tagIds);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 115

``php
                $product->syncMeta($meta);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 118

``php
            return $product->fresh(['tags', 'meta']);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 122

``php
    public function delete(Product $product): void
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 124

``php
        $product->delete(); // soft delete
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 127

``php
    public function toggleFeatured(Product $product): Product
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 129

``php
        if (! $product->is_featured) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 130

``php
            $activeFeaturedCount = Product::query()->where('is_featured', true)->count();
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 132

``php
            if ($activeFeaturedCount >= self::MAX_FEATURED_PRODUCTS) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 134

``php
                    'is_featured' => 'حداکثر '.self::MAX_FEATURED_PRODUCTS.' محصول می‌توانند هم‌زمان ویژه باشند.',
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 139

``php
        $product->update(['is_featured' => ! $product->is_featured]);
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 141

``php
        return $product->fresh();
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 145

``php
    public function incrementViews(Product $product): void
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 147

``php
        $product->increment('views_count');
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 150

``php
    public function restore(Product $product): Product
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 152

``php
        return DB::transaction(function () use ($product) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 153

``php
            $product->restore();
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 155

``php
            return $product->fresh();
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 162

``php
     * product_images/product_videos رو حذف می‌کنه، نه فایل واقعی روی storage.
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 164

``php
    public function forceDelete(Product $product): void
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 166

``php
        foreach ($product->images as $image) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 170

``php
        foreach ($product->videos as $video) {
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 174

``php
        $product->tags()->detach();
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 175

``php
        $product->meta()->delete();
``
## C:\Dev\GreenTools\apibackendlaravel\app\Services\Product\ProductService.php — Line 176

``php
        $product->forceDelete();
``
## C:\Dev\GreenTools\apibackendlaravel\config\app.php — Line 29

``php
    'env' => env('APP_ENV', 'production'),
``
## C:\Dev\GreenTools\apibackendlaravel\config\sanctum.php — Line 17

``php
    | and production domains which access your API via a frontend SPA.
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_02_131613_create_products_table.php — Line 11

``php
        Schema::create('products', function (Blueprint $table) {
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_02_131613_create_products_table.php — Line 54

``php
        Schema::dropIfExists('products');
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_02_131614_create_product_images_table.php — Line 11

``php
        Schema::create('product_images', function (Blueprint $table) {
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_02_131614_create_product_images_table.php — Line 13

``php
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_02_131614_create_product_images_table.php — Line 21

``php
            $table->index(['product_id', 'is_primary']);
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_02_131614_create_product_images_table.php — Line 27

``php
        Schema::dropIfExists('product_images');
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_02_131615_create_product_videos_table.php — Line 11

``php
        Schema::create('product_videos', function (Blueprint $table) {
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_02_131615_create_product_videos_table.php — Line 13

``php
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_02_131615_create_product_videos_table.php — Line 29

``php
            $table->index('product_id');
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_02_131615_create_product_videos_table.php — Line 35

``php
        Schema::dropIfExists('product_videos');
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_16_143721_add_usd_pricing_to_products_table.php — Line 14

``php
        Schema::table('products', function (Blueprint $table) {
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_16_143721_add_usd_pricing_to_products_table.php — Line 18

``php
        Schema::table('products', function (Blueprint $table) {
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_16_143721_add_usd_pricing_to_products_table.php — Line 24

``php
            DB::statement('ALTER TABLE products ADD CONSTRAINT products_price_usd_non_negative CHECK (price_usd >= 0)');
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_16_143721_add_usd_pricing_to_products_table.php — Line 30

``php
        Schema::table('products', function (Blueprint $table) {
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_20_132210_create_product_price_proposals_table.php — Line 11

``php
        Schema::create('product_price_proposals', function (Blueprint $table) {
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_20_132210_create_product_price_proposals_table.php — Line 18

``php
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_20_132210_create_product_price_proposals_table.php — Line 31

``php
            $table->unique(['batch_id', 'product_id']);
``
## C:\Dev\GreenTools\apibackendlaravel\database\migrations\2026_08_20_132210_create_product_price_proposals_table.php — Line 38

``php
        Schema::dropIfExists('product_price_proposals');
``
## C:\Dev\GreenTools\apibackendlaravel\database\seeders\GrantPricesManualOverridePermissionSeeder.php — Line 18

``php
 *                             separate from product price review)
``
## C:\Dev\GreenTools\apibackendlaravel\database\seeders\GrantPricesManualOverridePermissionSeeder.php — Line 19

``php
 *  - prices.review          (required by ProductPriceProposalPolicy::viewAny(), to view/approve/
``
## C:\Dev\GreenTools\apibackendlaravel\database\seeders\GrantPricesManualOverridePermissionSeeder.php — Line 20

``php
 *                             reject product price proposals - the "product price update" side)
``
## C:\Dev\GreenTools\apibackendlaravel\database\seeders\RolePermissionSeeder.php — Line 14

``php
            'products.view', 'products.create', 'products.update', 'products.delete', 'products.manage', 'products.trash',
``
## C:\Dev\GreenTools\apibackendlaravel\database\seeders\RolePermissionSeeder.php — Line 27

``php
            'products.view', 'products.create', 'products.update',
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api.php — Line 22

``php
Route::prefix('v1/products')->group(base_path('routes/api/v1/products.php'));
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 3

``php
use App\Http\Controllers\Api\V1\Admin\ProductController as AdminProductController;
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 4

``php
use App\Http\Controllers\Api\V1\Admin\ProductMediaController;
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 5

``php
use App\Http\Controllers\Api\V1\Public\ProductController as PublicProductController;
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 21

``php
        Route::get('/', [AdminProductController::class, 'index']);
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 22

``php
        Route::post('/', [AdminProductController::class, 'store']);
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 25

``php
        Route::get('trash', [AdminProductController::class, 'trash']);
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 29

``php
            [AdminProductController::class, 'restore']
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 34

``php
            [AdminProductController::class, 'forceDestroy']
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 38

``php
        // Product
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 39

``php
        Route::get('{product}', [AdminProductController::class, 'show']);
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 42

``php
            '{product}',
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 43

``php
            [AdminProductController::class, 'update']
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 47

``php
            '{product}',
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 48

``php
            [AdminProductController::class, 'destroy']
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 52

``php
            '{product}/toggle-featured',
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 53

``php
            [AdminProductController::class, 'toggleFeatured']
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 59

``php
            '{product}/images',
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 60

``php
            [ProductMediaController::class, 'storeImages']
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 64

``php
            '{product}/images/{image}/primary',
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 65

``php
            [ProductMediaController::class, 'setPrimaryImage']
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 69

``php
            '{product}/images/{image}',
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 70

``php
            [ProductMediaController::class, 'destroyImage']
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 76

``php
            '{product}/videos',
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 77

``php
            [ProductMediaController::class, 'storeVideo']
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 81

``php
            '{product}/videos/{video}',
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 82

``php
            [ProductMediaController::class, 'destroyVideo']
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 96

``php
        [PublicProductController::class, 'featured']
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 101

``php
        [PublicProductController::class, 'index']
``
## C:\Dev\GreenTools\apibackendlaravel\routes\api\v1\products.php — Line 106

``php
        [PublicProductController::class, 'show']
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\brick\math\src\BigDecimal.php — Line 367

``php
     * Returns the product of this number and the given one.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\brick\math\src\BigInteger.php — Line 470

``php
     * Returns the product of this number and the given one.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\brick\math\src\BigRational.php — Line 267

``php
     * Returns the product of this number and the given one.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 10

``php
    'App\\DTOs\\Product\\ProductFilterDTO' => $baseDir . '/app/DTOs/Product/ProductFilterDTO.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 21

``php
    'App\\Exceptions\\Product\\ProductMediaNotFoundException' => $baseDir . '/app/Exceptions/Product/ProductMediaNotFoundException.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 22

``php
    'App\\Exceptions\\Product\\ProductMediaValidationException' => $baseDir . '/app/Exceptions/Product/ProductMediaValidationException.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 27

``php
    'App\\Http\\Controllers\\Api\\V1\\Admin\\ProductController' => $baseDir . '/app/Http/Controllers/Api/V1/Admin/ProductController.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 28

``php
    'App\\Http\\Controllers\\Api\\V1\\Admin\\ProductMediaController' => $baseDir . '/app/Http/Controllers/Api/V1/Admin/ProductMediaController.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 34

``php
    'App\\Http\\Controllers\\Api\\V1\\Public\\ProductController' => $baseDir . '/app/Http/Controllers/Api/V1/Public/ProductController.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 52

``php
    'App\\Http\\Requests\\Api\\V1\\Product\\AdminProductIndexRequest' => $baseDir . '/app/Http/Requests/Api/V1/Product/AdminProductIndexRequest.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 53

``php
    'App\\Http\\Requests\\Api\\V1\\Product\\ProductIndexRequest' => $baseDir . '/app/Http/Requests/Api/V1/Product/ProductIndexRequest.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 54

``php
    'App\\Http\\Requests\\Api\\V1\\Product\\StoreProductImageRequest' => $baseDir . '/app/Http/Requests/Api/V1/Product/StoreProductImageRequest.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 55

``php
    'App\\Http\\Requests\\Api\\V1\\Product\\StoreProductRequest' => $baseDir . '/app/Http/Requests/Api/V1/Product/StoreProductRequest.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 56

``php
    'App\\Http\\Requests\\Api\\V1\\Product\\StoreProductVideoRequest' => $baseDir . '/app/Http/Requests/Api/V1/Product/StoreProductVideoRequest.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 57

``php
    'App\\Http\\Requests\\Api\\V1\\Product\\UpdateProductRequest' => $baseDir . '/app/Http/Requests/Api/V1/Product/UpdateProductRequest.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 60

``php
    'App\\Http\\Resources\\ProductImageResource' => $baseDir . '/app/Http/Resources/ProductImageResource.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 61

``php
    'App\\Http\\Resources\\ProductListResource' => $baseDir . '/app/Http/Resources/ProductListResource.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 62

``php
    'App\\Http\\Resources\\ProductPriceProposalResource' => $baseDir . '/app/Http/Resources/ProductPriceProposalResource.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 63

``php
    'App\\Http\\Resources\\ProductResource' => $baseDir . '/app/Http/Resources/ProductResource.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 64

``php
    'App\\Http\\Resources\\ProductVideoResource' => $baseDir . '/app/Http/Resources/ProductVideoResource.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 66

``php
    'App\\Jobs\\RecalculateProductPricesJob' => $baseDir . '/app/Jobs/RecalculateProductPricesJob.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 76

``php
    'App\\Models\\Product' => $baseDir . '/app/Models/Product.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 77

``php
    'App\\Models\\ProductImage' => $baseDir . '/app/Models/ProductImage.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 78

``php
    'App\\Models\\ProductPriceProposal' => $baseDir . '/app/Models/ProductPriceProposal.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 79

``php
    'App\\Models\\ProductVideo' => $baseDir . '/app/Models/ProductVideo.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 84

``php
    'App\\Policies\\ProductPolicy' => $baseDir . '/app/Policies/ProductPolicy.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 85

``php
    'App\\Policies\\ProductPriceProposalPolicy' => $baseDir . '/app/Policies/ProductPriceProposalPolicy.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 91

``php
    'App\\Services\\Media\\ProductMediaService' => $baseDir . '/app/Services/Media/ProductMediaService.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 101

``php
    'App\\Services\\Product\\ProductFilterService' => $baseDir . '/app/Services/Product/ProductFilterService.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_classmap.php — Line 102

``php
    'App\\Services\\Product\\ProductService' => $baseDir . '/app/Services/Product/ProductService.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 637

``php
        'App\\DTOs\\Product\\ProductFilterDTO' => __DIR__ . '/../..' . '/app/DTOs/Product/ProductFilterDTO.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 648

``php
        'App\\Exceptions\\Product\\ProductMediaNotFoundException' => __DIR__ . '/../..' . '/app/Exceptions/Product/ProductMediaNotFoundException.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 649

``php
        'App\\Exceptions\\Product\\ProductMediaValidationException' => __DIR__ . '/../..' . '/app/Exceptions/Product/ProductMediaValidationException.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 654

``php
        'App\\Http\\Controllers\\Api\\V1\\Admin\\ProductController' => __DIR__ . '/../..' . '/app/Http/Controllers/Api/V1/Admin/ProductController.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 655

``php
        'App\\Http\\Controllers\\Api\\V1\\Admin\\ProductMediaController' => __DIR__ . '/../..' . '/app/Http/Controllers/Api/V1/Admin/ProductMediaController.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 661

``php
        'App\\Http\\Controllers\\Api\\V1\\Public\\ProductController' => __DIR__ . '/../..' . '/app/Http/Controllers/Api/V1/Public/ProductController.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 679

``php
        'App\\Http\\Requests\\Api\\V1\\Product\\AdminProductIndexRequest' => __DIR__ . '/../..' . '/app/Http/Requests/Api/V1/Product/AdminProductIndexRequest.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 680

``php
        'App\\Http\\Requests\\Api\\V1\\Product\\ProductIndexRequest' => __DIR__ . '/../..' . '/app/Http/Requests/Api/V1/Product/ProductIndexRequest.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 681

``php
        'App\\Http\\Requests\\Api\\V1\\Product\\StoreProductImageRequest' => __DIR__ . '/../..' . '/app/Http/Requests/Api/V1/Product/StoreProductImageRequest.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 682

``php
        'App\\Http\\Requests\\Api\\V1\\Product\\StoreProductRequest' => __DIR__ . '/../..' . '/app/Http/Requests/Api/V1/Product/StoreProductRequest.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 683

``php
        'App\\Http\\Requests\\Api\\V1\\Product\\StoreProductVideoRequest' => __DIR__ . '/../..' . '/app/Http/Requests/Api/V1/Product/StoreProductVideoRequest.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 684

``php
        'App\\Http\\Requests\\Api\\V1\\Product\\UpdateProductRequest' => __DIR__ . '/../..' . '/app/Http/Requests/Api/V1/Product/UpdateProductRequest.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 687

``php
        'App\\Http\\Resources\\ProductImageResource' => __DIR__ . '/../..' . '/app/Http/Resources/ProductImageResource.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 688

``php
        'App\\Http\\Resources\\ProductListResource' => __DIR__ . '/../..' . '/app/Http/Resources/ProductListResource.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 689

``php
        'App\\Http\\Resources\\ProductPriceProposalResource' => __DIR__ . '/../..' . '/app/Http/Resources/ProductPriceProposalResource.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 690

``php
        'App\\Http\\Resources\\ProductResource' => __DIR__ . '/../..' . '/app/Http/Resources/ProductResource.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 691

``php
        'App\\Http\\Resources\\ProductVideoResource' => __DIR__ . '/../..' . '/app/Http/Resources/ProductVideoResource.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 693

``php
        'App\\Jobs\\RecalculateProductPricesJob' => __DIR__ . '/../..' . '/app/Jobs/RecalculateProductPricesJob.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 703

``php
        'App\\Models\\Product' => __DIR__ . '/../..' . '/app/Models/Product.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 704

``php
        'App\\Models\\ProductImage' => __DIR__ . '/../..' . '/app/Models/ProductImage.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 705

``php
        'App\\Models\\ProductPriceProposal' => __DIR__ . '/../..' . '/app/Models/ProductPriceProposal.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 706

``php
        'App\\Models\\ProductVideo' => __DIR__ . '/../..' . '/app/Models/ProductVideo.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 711

``php
        'App\\Policies\\ProductPolicy' => __DIR__ . '/../..' . '/app/Policies/ProductPolicy.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 712

``php
        'App\\Policies\\ProductPriceProposalPolicy' => __DIR__ . '/../..' . '/app/Policies/ProductPriceProposalPolicy.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 718

``php
        'App\\Services\\Media\\ProductMediaService' => __DIR__ . '/../..' . '/app/Services/Media/ProductMediaService.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 728

``php
        'App\\Services\\Product\\ProductFilterService' => __DIR__ . '/../..' . '/app/Services/Product/ProductFilterService.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\composer\autoload_static.php — Line 729

``php
        'App\\Services\\Product\\ProductService' => __DIR__ . '/../..' . '/app/Services/Product/ProductService.php',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\darkaonline\l5-swagger\config\l5-swagger.php — Line 253

``php
         * Set this to `false` to disable swagger generation on production
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\doctrine\dbal\src\Query\QueryBuilder.php — Line 772

``php
     * given alias, forming a cartesian product with any existing query roots.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\da_DK\Company.php — Line 44

``php
     * @var string P number (production number) format.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\de_CH\Text.php — Line 1930

``php
    with this agreement, and any volunteers associated with the production,
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\de_DE\Text.php — Line 1930

``php
    with this agreement, and any volunteers associated with the production,
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\el_GR\Text.php — Line 2329

``php
    of this License including without limitation any production in the
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\en_US\Company.php — Line 21

``php
            'ability', 'access', 'adapter', 'algorithm', 'alliance', 'analyzer', 'application', 'approach', 'architecture', 'archive', 'artificialintelligence', 'array', 'attitude', 'benchmark', 'blockchain', 'budgetarymanagement', 'capability', 'capacity', 'challenge', 'circuit', 'collaboration', 'complexity', 'concept', 'conglomeration', 'contingency', 'core', 'customerloyalty', 'database', 'data-warehouse', 'definition', 'emulation', 'encoding', 'encryption', 'extranet', 'firmware', 'flexibility', 'focusgroup', 'forecast', 'frame', 'framework', 'function', 'functionalities', 'GraphicInterface', 'groupware', 'GraphicalUserInterface', 'hardware', 'help-desk', 'hierarchy', 'hub', 'implementation', 'info-mediaries', 'infrastructure', 'initiative', 'installation', 'instructionset', 'interface', 'internetsolution', 'intranet', 'knowledgeuser', 'knowledgebase', 'localareanetwork', 'leverage', 'matrices', 'matrix', 'methodology', 'middleware', 'migration', 'model', 'moderator', 'monitoring', 'moratorium', 'neural-net', 'openarchitecture', 'opensystem', 'orchestration', 'paradigm', 'parallelism', 'policy', 'portal', 'pricingstructure', 'processimprovement', 'product', 'productivity', 'project', 'projection', 'protocol', 'securedline', 'service-desk', 'software', 'solution', 'standardization', 'strategy', 'structure', 'success', 'superstructure', 'support', 'synergy', 'systemengine', 'task-force', 'throughput', 'time-frame', 'toolset', 'utilisation', 'website', 'workforce',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\en_US\Company.php — Line 27

``php
            'implement', 'utilize', 'integrate', 'streamline', 'optimize', 'evolve', 'transform', 'embrace', 'enable', 'orchestrate', 'leverage', 'reinvent', 'aggregate', 'architect', 'enhance', 'incentivize', 'morph', 'empower', 'envisioneer', 'monetize', 'harness', 'facilitate', 'seize', 'disintermediate', 'synergize', 'strategize', 'deploy', 'brand', 'grow', 'target', 'syndicate', 'synthesize', 'deliver', 'mesh', 'incubate', 'engage', 'maximize', 'benchmark', 'expedite', 'reintermediate', 'whiteboard', 'visualize', 'repurpose', 'innovate', 'scale', 'unleash', 'drive', 'extend', 'engineer', 'revolutionize', 'generate', 'exploit', 'transition', 'e-enable', 'iterate', 'cultivate', 'matrix', 'productize', 'redefine', 'recontextualize',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\en_US\Company.php — Line 41

``php
        'Able Seamen', 'Account Manager', 'Accountant', 'Actor', 'Actuary', 'Adjustment Clerk', 'Admin', 'Administrative Law Judge', 'Administrative Services Manager', 'Administrative Support Supervisors', 'Advertising Manager OR Promotions Manager', 'Advertising Sales Agent', 'Aerospace Engineer', 'Agricultural Crop Farm Manager', 'Agricultural Crop Worker', 'Agricultural Engineer', 'Agricultural Equipment Operator', 'Agricultural Inspector', 'Agricultural Manager', 'Agricultural Product Grader Sorter', 'Agricultural Sales Representative', 'Agricultural Science Technician', 'Agricultural Sciences Teacher', 'Agricultural Technician', 'Agricultural Worker', 'Air Crew Member', 'Air Crew Officer', 'Air Traffic Controller', 'Aircraft Assembler', 'Aircraft Body Repairer', 'Aircraft Cargo Handling Supervisor', 'Aircraft Engine Specialist', 'Aircraft Launch and Recovery Officer', 'Aircraft Launch Specialist', 'Aircraft Mechanics OR Aircraft Service Technician', 'Aircraft Rigging Assembler', 'Aircraft Structure Assemblers', 'Airfield Operations Specialist', 'Airframe Mechanic', 'Airline Pilot OR Copilot OR Flight Engineer', 'Algorithm Developer', 'Alteration Tailor', 'Ambulance Driver', 'Amusement Attendant', 'Anesthesiologist', 'Animal Breeder', 'Animal Care Workers', 'Animal Control Worker', 'Animal Husbandry Worker', 'Animal Scientist', 'Animal Trainer', 'Annealing Machine Operator', 'Announcer', 'Answering Service', 'Anthropologist', 'Anthropologist OR Archeologist', 'Anthropology Teacher', 'Appliance Repairer', 'Arbitrator', 'Archeologist', 'Architect', 'Architectural Drafter', 'Architectural Drafter OR Civil Drafter', 'Architecture Teacher', 'Archivist', 'Armored Assault Vehicle Crew Member', 'Armored Assault Vehicle Officer', 'Art Director', 'Art Teacher', 'Artillery Officer', 'Artillery Crew Member', 'Artist', 'Assembler', 'Assessor', 'Astronomer', 'Athletes and Sports Competitor', 'Athletic Trainer', 'Atmospheric and Space Scientist', 'Audio and Video Equipment Technician', 'Audiologist', 'Audio-Visual Collections Specialist', 'Auditor', 'Auditor', 'Automatic Teller Machine Servicer', 'Automotive Body Repairer', 'Automotive Glass Installers', 'Automotive Master Mechanic', 'Automotive Mechanic', 'Automotive Specialty Technician', 'Automotive Technician', 'Auxiliary Equipment Operator', 'Aviation Inspector', 'Avionics Technician',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\en_US\Company.php — Line 46

``php
        'Fabric Mender', 'Fabric Pressers', 'Farm and Home Management Advisor', 'Farm Equipment Mechanic', 'Farm Labor Contractor', 'Farmer', 'Farmworker', 'Fashion Designer', 'Fashion Model', 'Fast Food Cook', 'Fence Erector', 'Fiber Product Cutting Machine Operator', 'Fiberglass Laminator and Fabricator', 'File Clerk', 'Film Laboratory Technician', 'Financial Analyst', 'Financial Examiner', 'Financial Manager', 'Financial Services Sales Agent', 'Financial Specialist', 'Fire Fighter', 'Fire Inspector', 'Fire Investigator', 'Fire-Prevention Engineer', 'First-Line Supervisor-Manager of Landscaping, Lawn Service, and Groundskeeping Worker', 'Fish Game Warden', 'Fish Hatchery Manager', 'Fishery Worker', 'Fishing OR Forestry Supervisor', 'Fitness Trainer', 'Fitter', 'Flight Attendant', 'Floor Finisher', 'Floor Layer', 'Floral Designer', 'Food Batchmaker', 'Food Cooking Machine Operators', 'Food Preparation', 'Food Preparation and Serving Worker', 'Food Preparation Worker', 'Food Science Technician', 'Food Scientists and Technologist', 'Food Servers', 'Food Service Manager', 'Food Tobacco Roasting', 'Foreign Language Teacher', 'Forensic Investigator', 'Forensic Science Technician', 'Forest and Conservation Technician', 'Forest and Conservation Worker', 'Forest Fire Fighter', 'Forest Fire Fighting Supervisor', 'Forest Fire Inspector', 'Forester', 'Forestry Conservation Science Teacher', 'Forging Machine Setter', 'Forming Machine Operator', 'Forming Machine Operator', 'Foundry Mold and Coremaker', 'Fraud Investigator', 'Freight Agent', 'Freight and Material Mover', 'Freight Inspector', 'Funeral Attendant', 'Funeral Director', 'Furnace Operator', 'Furniture Finisher',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\en_US\Company.php — Line 49

``php
        'Illustrator', 'Immigration Inspector OR Customs Inspector', 'Industrial Engineer', 'Industrial Engineering Technician', 'Industrial Equipment Maintenance', 'Industrial Machinery Mechanic', 'Industrial Production Manager', 'Industrial Safety Engineer', 'Industrial-Organizational Psychologist', 'Infantry', 'Infantry Officer', 'Information Systems Manager', 'Inspector', 'Installation and Repair Technician', 'Instructional Coordinator', 'Instrument Sales Representative', 'Insulation Installer', 'Insulation Worker', 'Insurance Investigator', 'Insurance Appraiser', 'Insurance Claims Clerk', 'Insurance Policy Processing Clerk', 'Insurance Sales Agent', 'Insurance Underwriter', 'Interaction Designer', 'Interior Designer', 'Internist', 'Interpreter OR Translator', 'Interviewer', 'Irradiated-Fuel Handler',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\en_US\Company.php — Line 56

``php
        'Packaging Machine Operator', 'Packer and Packager', 'Painter', 'Painter and Illustrator', 'Painting Machine Operator', 'Pantograph Engraver', 'Paper Goods Machine Operator', 'Paperhanger', 'Paralegal', 'Park Naturalist', 'Parking Enforcement Worker', 'Parking Lot Attendant', 'Parts Salesperson', 'Paste-Up Worker', 'Pastry Chef', 'Patrol Officer', 'Patternmaker', 'Paving Equipment Operator', 'Payroll Clerk', 'Pediatricians', 'Percussion Instrument Repairer', 'Personal Care Worker', 'Personal Financial Advisor', 'Personal Home Care Aide', 'Personal Service Worker', 'Personal Trainer', 'Personnel Recruiter', 'Pest Control Worker', 'Pesticide Sprayer', 'Petroleum Engineer', 'Petroleum Pump Operator', 'Petroleum Pump System Operator', 'Petroleum Technician', 'Pewter Caster', 'Pharmaceutical Sales Representative', 'Pharmacist', 'Pharmacy Aide', 'Pharmacy Technician', 'Philosophy and Religion Teacher', 'Photoengraver', 'Photoengraving Machine Operator', 'Photographer', 'Photographic Restorer', 'Photographic Developer', 'Photographic Process Worker', 'Photographic Processing Machine Operator', 'Photographic Reproduction Technician', 'Physical Scientist', 'Physical Therapist', 'Physical Therapist Aide', 'Physical Therapist Assistant', 'Physician', 'Physician Assistant', 'Physicist', 'Physics Teacher', 'Pile-Driver Operator', 'Pipe Fitter', 'Pipefitter', 'Pipelayer', 'Pipelaying Fitter', 'Plant and System Operator', 'Plant Scientist', 'Plasterer OR Stucco Mason', 'Plastic Molding Machine Operator', 'Plate Finisher', 'Platemaker', 'Plating Machine Operator', 'Plating Operator', 'Plating Operator OR Coating Machine Operator', 'Plumber', 'Plumber OR Pipefitter OR Steamfitter', 'Podiatrist', 'Poet OR Lyricist', 'Police and Sheriffs Patrol Officer', 'Police Detective', 'Police Identification OR Records Officer', 'Political Science Teacher', 'Political Scientist', 'Portable Power Tool Repairer', 'Postal Clerk', 'Postal Service Clerk', 'Postal Service Mail Carrier', 'Postal Service Mail Sorter', 'Postmasters', 'Postsecondary Education Administrators', 'Postsecondary Teacher', 'Potter', 'Poultry Cutter', 'Power Distributors OR Dispatcher', 'Power Generating Plant Operator', 'Power Plant Operator', 'PR Manager', 'Precious Stone Worker', 'Precision Aircraft Systems Assemblers', 'Precision Devices Inspector', 'Precision Dyer', 'Precision Etcher and Engraver', 'Precision Instrument Repairer', 'Precision Lens Grinders and Polisher', 'Precision Mold and Pattern Caster', 'Precision Pattern and Die Caster', 'Precision Printing Worker', 'Prepress Technician', 'Preschool Education Administrators', 'Preschool Teacher', 'Press Machine Setter, Operator', 'Pressing Machine Operator', 'Pressure Vessel Inspector', 'Printing Machine Operator', 'Printing Press Machine Operator', 'Private Detective and Investigator', 'Private Household Cook', 'Private Sector Executive', 'Probation Officers and Correctional Treatment Specialist', 'Procurement Clerk', 'Producer', 'Producers and Director', 'Product Management Leader', 'Product Promoter', 'Product Safety Engineer', 'Product Specialist', 'Production Control Manager', 'Production Helper', 'Production Inspector', 'Production Laborer', 'Production Manager', 'Production Planner', 'Production Planning', 'Production Worker', 'Professional Photographer', 'Professor', 'Program Director', 'Project Manager', 'Proofreaders and Copy Marker', 'Prosthodontist', 'Protective Service Worker', 'Protective Service Worker', 'Psychiatric Aide', 'Psychiatric Technician', 'Psychiatrist', 'Psychologist', 'Psychology Teacher', 'Public Health Social Worker', 'Public Relations Manager', 'Public Relations Specialist', 'Public Transportation Inspector', 'Pump Operators', 'Punching Machine Setters', 'Purchasing Agent', 'Purchasing Manager',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\en_US\Text.php — Line 3613

``php
    with this agreement, and any volunteers associated with the production,
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\es_AR\Company.php — Line 23

``php
            'ability', 'access', 'adapter', 'algorithm', 'alliance', 'analyzer', 'application', 'approach', 'architecture', 'archive', 'artificialintelligence', 'array', 'attitude', 'benchmark', 'budgetarymanagement', 'capability', 'capacity', 'challenge', 'circuit', 'collaboration', 'complexity', 'concept', 'conglomeration', 'contingency', 'core', 'customerloyalty', 'database', 'data-warehouse', 'definition', 'emulation', 'encoding', 'encryption', 'extranet', 'firmware', 'flexibility', 'focusgroup', 'forecast', 'frame', 'framework', 'function', 'functionalities', 'GraphicInterface', 'groupware', 'GraphicalUserInterface', 'hardware', 'help-desk', 'hierarchy', 'hub', 'implementation', 'info-mediaries', 'infrastructure', 'initiative', 'installation', 'instructionset', 'interface', 'internetsolution', 'intranet', 'knowledgeuser', 'knowledgebase', 'localareanetwork', 'leverage', 'matrices', 'matrix', 'methodology', 'middleware', 'migration', 'model', 'moderator', 'monitoring', 'moratorium', 'neural-net', 'openarchitecture', 'opensystem', 'orchestration', 'paradigm', 'parallelism', 'policy', 'portal', 'pricingstructure', 'processimprovement', 'product', 'productivity', 'project', 'projection', 'protocol', 'securedline', 'service-desk', 'software', 'solution', 'standardization', 'strategy', 'structure', 'success', 'superstructure', 'support', 'synergy', 'systemengine', 'task-force', 'throughput', 'time-frame', 'toolset', 'utilisation', 'website', 'workforce',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\es_AR\Company.php — Line 29

``php
            'implement', 'utilize', 'integrate', 'streamline', 'optimize', 'evolve', 'transform', 'embrace', 'enable', 'orchestrate', 'leverage', 'reinvent', 'aggregate', 'architect', 'enhance', 'incentivize', 'morph', 'empower', 'envisioneer', 'monetize', 'harness', 'facilitate', 'seize', 'disintermediate', 'synergize', 'strategize', 'deploy', 'brand', 'grow', 'target', 'syndicate', 'synthesize', 'deliver', 'mesh', 'incubate', 'engage', 'maximize', 'benchmark', 'expedite', 'reintermediate', 'whiteboard', 'visualize', 'repurpose', 'innovate', 'scale', 'unleash', 'drive', 'extend', 'engineer', 'revolutionize', 'generate', 'exploit', 'transition', 'e-enable', 'iterate', 'cultivate', 'matrix', 'productize', 'redefine', 'recontextualize',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\es_ES\Company.php — Line 28

``php
            'ability', 'access', 'adapter', 'algorithm', 'alliance', 'analyzer', 'application', 'approach', 'architecture', 'archive', 'artificialintelligence', 'array', 'attitude', 'benchmark', 'budgetarymanagement', 'capability', 'capacity', 'challenge', 'circuit', 'collaboration', 'complexity', 'concept', 'conglomeration', 'contingency', 'core', 'customerloyalty', 'database', 'data-warehouse', 'definition', 'emulation', 'encoding', 'encryption', 'extranet', 'firmware', 'flexibility', 'focusgroup', 'forecast', 'frame', 'framework', 'function', 'functionalities', 'GraphicInterface', 'groupware', 'GraphicalUserInterface', 'hardware', 'help-desk', 'hierarchy', 'hub', 'implementation', 'info-mediaries', 'infrastructure', 'initiative', 'installation', 'instructionset', 'interface', 'internetsolution', 'intranet', 'knowledgeuser', 'knowledgebase', 'localareanetwork', 'leverage', 'matrices', 'matrix', 'methodology', 'middleware', 'migration', 'model', 'moderator', 'monitoring', 'moratorium', 'neural-net', 'openarchitecture', 'opensystem', 'orchestration', 'paradigm', 'parallelism', 'policy', 'portal', 'pricingstructure', 'processimprovement', 'product', 'productivity', 'project', 'projection', 'protocol', 'securedline', 'service-desk', 'software', 'solution', 'standardization', 'strategy', 'structure', 'success', 'superstructure', 'support', 'synergy', 'systemengine', 'task-force', 'throughput', 'time-frame', 'toolset', 'utilisation', 'website', 'workforce',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\es_ES\Company.php — Line 34

``php
            'implement', 'utilize', 'integrate', 'streamline', 'optimize', 'evolve', 'transform', 'embrace', 'enable', 'orchestrate', 'leverage', 'reinvent', 'aggregate', 'architect', 'enhance', 'incentivize', 'morph', 'empower', 'envisioneer', 'monetize', 'harness', 'facilitate', 'seize', 'disintermediate', 'synergize', 'strategize', 'deploy', 'brand', 'grow', 'target', 'syndicate', 'synthesize', 'deliver', 'mesh', 'incubate', 'engage', 'maximize', 'benchmark', 'expedite', 'reintermediate', 'whiteboard', 'visualize', 'repurpose', 'innovate', 'scale', 'unleash', 'drive', 'extend', 'engineer', 'revolutionize', 'generate', 'exploit', 'transition', 'e-enable', 'iterate', 'cultivate', 'matrix', 'productize', 'redefine', 'recontextualize',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\es_PE\Company.php — Line 23

``php
            'ability', 'access', 'adapter', 'algorithm', 'alliance', 'analyzer', 'application', 'approach', 'architecture', 'archive', 'artificialintelligence', 'array', 'attitude', 'benchmark', 'budgetarymanagement', 'capability', 'capacity', 'challenge', 'circuit', 'collaboration', 'complexity', 'concept', 'conglomeration', 'contingency', 'core', 'customerloyalty', 'database', 'data-warehouse', 'definition', 'emulation', 'encoding', 'encryption', 'extranet', 'firmware', 'flexibility', 'focusgroup', 'forecast', 'frame', 'framework', 'function', 'functionalities', 'GraphicInterface', 'groupware', 'GraphicalUserInterface', 'hardware', 'help-desk', 'hierarchy', 'hub', 'implementation', 'info-mediaries', 'infrastructure', 'initiative', 'installation', 'instructionset', 'interface', 'internetsolution', 'intranet', 'knowledgeuser', 'knowledgebase', 'localareanetwork', 'leverage', 'matrices', 'matrix', 'methodology', 'middleware', 'migration', 'model', 'moderator', 'monitoring', 'moratorium', 'neural-net', 'openarchitecture', 'opensystem', 'orchestration', 'paradigm', 'parallelism', 'policy', 'portal', 'pricingstructure', 'processimprovement', 'product', 'productivity', 'project', 'projection', 'protocol', 'securedline', 'service-desk', 'software', 'solution', 'standardization', 'strategy', 'structure', 'success', 'superstructure', 'support', 'synergy', 'systemengine', 'task-force', 'throughput', 'time-frame', 'toolset', 'utilisation', 'website', 'workforce',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\es_PE\Company.php — Line 29

``php
            'implement', 'utilize', 'integrate', 'streamline', 'optimize', 'evolve', 'transform', 'embrace', 'enable', 'orchestrate', 'leverage', 'reinvent', 'aggregate', 'architect', 'enhance', 'incentivize', 'morph', 'empower', 'envisioneer', 'monetize', 'harness', 'facilitate', 'seize', 'disintermediate', 'synergize', 'strategize', 'deploy', 'brand', 'grow', 'target', 'syndicate', 'synthesize', 'deliver', 'mesh', 'incubate', 'engage', 'maximize', 'benchmark', 'expedite', 'reintermediate', 'whiteboard', 'visualize', 'repurpose', 'innovate', 'scale', 'unleash', 'drive', 'extend', 'engineer', 'revolutionize', 'generate', 'exploit', 'transition', 'e-enable', 'iterate', 'cultivate', 'matrix', 'productize', 'redefine', 'recontextualize',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\fr_CA\Text.php — Line 2334

``php
    with this agreement, and any volunteers associated with the production,
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\fr_FR\Text.php — Line 5438

``php
improductives et quelles les nutritives, s'il est bon de les
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\fr_FR\Text.php — Line 9453

``php
voir dans cette reproduction de ses douleurs qu'une fantaisie
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\fr_FR\Text.php — Line 15424

``php
    with this agreement, and any volunteers associated with the production,
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\it_IT\Text.php — Line 1971

``php
    with this agreement, and any volunteers associated with the production,
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\kk_KZ\Text.php — Line 225

``php
    of this License including without limitation any production in the
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\ms_MY\Company.php — Line 73

``php
        'Maintenance', 'Makanan', 'Makanan Bermasak', 'Makanan Bermasak', 'Makanan Dan Bahan Mentah Kering', 'Makanan dan Minuman', 'Makanan Haiwan', 'Makmal', 'Malim Kapal', 'Marker', 'Mechanisation System', 'Media Cetak', 'Media Elektronik', 'Medium Penyimpanan', 'Membaik Pulih Bateri', 'Membaik Pulih Tayar', 'Membaik Pulih TempatDuduk', 'Membaiki Buff Fuel Tank', 'Membaikpulih BahanTerbitan Dan Manuskrip', 'Membekal Air', 'Membeli Barang Lusuh Perlu Permit', 'Membeli Barang Lusuh Tanpa Permit', 'Membersih Kawasan', 'Membersih Kenderaan', 'Membersih Pantai', 'Memproses Air', 'Memproses Filem', 'Menangkap', 'Mencetak Borang', 'Mencetak Buku, Majalah, Laporan Akhbar', 'Mencetak Continuous Stationery Forms', 'Mencetak Fail, Kad Perniagaan Dan Kad Ucapan', 'Mencetak Label, Poster dan Pelekat', 'Mencetak Label, Poster, Pelekat dan Iron On', 'Mencuci Kolam Renang', 'Menembak Haiwan', 'Mengangkat Sampah', 'Mengangkut Mayat', 'Mengikat Dan Melepas Tali Kapal', 'Menjahit Bukan Pakaian', 'Menjahit Pakaian Dan Kelengkapan', 'Menjilid Kulit Keras', 'Menjilid Kulit Lembut', 'Menyelam', 'Mereka-Cipta Dan Seni Halus', 'Mesin Dan Kelengkapan Bengkel', 'Mesin dan Kelengkapan Khusus', 'Mesin dan peralatan makmal', 'Mesin dan Peralatan Pejabat', 'Mesin dan Peralatan Woksyop', 'Mesin Pengimbas', 'Mesin-Mesin Pejabat', 'Mesin-Mesin Pejabat Dan Aksesori', 'Minuman Tambahan', 'Motel', 'Motor Dan Alat Ubah', 'Motosikal', 'Multimedia-products services and maintenance', 'Multimodal Transport Operator',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\ms_MY\Company.php — Line 77

``php
        'Perabot', 'Perabot Jalan Raya', 'Perabot Pejabat', 'Perabot, Perabot Makmal dan Kelengkapan Berasaskan', 'Peralatan', 'Peralatan Dan Kelengkapan Hospital', 'Peralatan Dan Kelengkapan Pertanian', 'Peralatan Dan Kelengkapan Perubatan', 'Peralatan Dan Perkakas Domestik', 'Peralatan Kawalan Api', 'Peralatan Kawalan Keselamatan', 'Peralatan Keselamatan', 'Peralatan Keselamatan dan Senjata', 'Peralatan Makmal Pengukuran, Pencerapan Dan Sukat', 'Peralatan Makmal serta Aksesori', 'Peralatan Marin', 'Peralatan Memancing', 'Peralatan Memburu', 'Peralatan Pemantauan Dan Pengesanan', 'Peralatan Pemprosesan Fotografi, Mikrofilem', 'Peralatan Pengawalan Perosak Tanaman', 'Peralatan Percetakan Serta Aksesori', 'Peralatan Perindustrian Hiliran', 'Peralatan Perindustrian Huluan', 'Peralatan Perkhemahan Dan Aktiviti Luar', 'Peralatan Servis Dan Selenggara', 'Peralatan Sistem Bunyi, Pembesar Suara dan Projektor', 'Peralatan Sistem Kumbahan Dan Aksesori', 'Peralatan Sukan', 'Peralatan Untuk Orang Kurang Upaya Dan Pemulihan', 'Perhubungan', 'Perikanan Dan Akuakultur', 'Perkakas', 'Perkakas Elektrik Dan Aksesori', 'Perkakas Elektronik Dan Aksesori', 'Perkakasan Dan Bahan Kebersihan Diri Dan Mandian, Kelengkapan Bilik Air', 'Perkakasan Penyuntingan', 'Perkhidmatan Fotostat', 'Perkhidmatan Mel Pukal', 'Permainan', 'Perosak, Rumpai', 'Persembahan', 'Pertanian', 'Perundingan', 'Pesakit', 'Pesawat', 'Pesawat Udara', 'Pest Control', 'Pestaria', 'Pewarna', 'Pisah Warna', 'Plastik', 'Plastik', 'Printers, storage area network', 'Production Testing, Surface Well Testing and Wire Line Services', 'Pump', 'Pusat Latihan', 'Pvc',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\nb_NO\Company.php — Line 46

``php
        'Pantelåner', 'Pappsalarbeider', 'Paraplymaker', 'Parkettlegger', 'Parkettsliper', 'Parksjef', 'Parlamentarisk Leder', 'Partisekretær', 'Parykkmaker', 'Parykkmakermester', 'Passkontrollør', 'Pater', 'Patolog', 'Pedagog', 'Pedagogisk Psykolog', 'Pelsbereder', 'Pelsdyroppdretter', 'Pelsmaker', 'Pengeutlåner', 'Perforerer', 'Perfusjonist', 'Personal-Og Økonomidirektør', 'Personalassistent', 'Personalleder', 'Petrofysiker', 'Petroleumsarkitekt', 'Phytoterapeut', 'Pianoreparatør', 'Pianostemmer', 'Piping Ingeniør', 'Pizzabaker', 'Pizzasjåfør', 'Planlegger', 'Planleggingssjef', 'Planner', 'Plasseringsrådgiver', 'Pleiemedarbeider', 'Pleier', 'Poet', 'Polaritetsterapeut', 'Poliklinikksykepleier', 'Poliseprodusent', 'Politiadvokat', 'Politiavdelingssjef', 'Politiførstebetjent', 'Politimester', 'Politioverkonstabel', 'Politisk Sekretær', 'Popmusiker', 'Porteføljeforvalter', 'Porteføljeselger', 'Post Doc.', 'Postdoktor', 'Postfortoller', 'Postfullmektig', 'Postinspektør', 'Postmester', 'Poståpner', 'Preparantassistent', 'Preserveringstekniker', 'Pressebas', 'Pressefotograf', 'Presser', 'Privatassurandør', 'Prodekan', 'Production Supervisor', 'Produksjonsingeniør', 'Produksjonskoordinator', 'Produksjonsmedarbeider', 'Produksjonsoperatør', 'Produksjonsteknisk Leder', 'Produktsekretær', 'Produkttester', 'Produktutviklingskoordinator', 'Programleder', 'Programmerer', 'Programmeringssjef', 'Programsjef', 'Programvaretester', 'Programvareutvikler', 'Promotionkonsulent', 'Promotionmedarbeider', 'Prorektor', 'Prosjektmegler', 'Prosjektoppfølger', 'Prosjektstyringssjef', 'Prosjektøkonom', 'Protesetekniker', 'Protokollfører', 'Protokollsekretær', 'Pubvert', 'Purserassistent', 'Påkleder', 'Pølsemaker',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\nl_NL\Company.php — Line 28

``php
        'Paardenfokker', 'Pakhuischef', 'Paleontoloog', 'Palfrenier', 'Pandjesbaas', 'Papierschepper', 'Papiervernisser', 'Parkeerwachter', 'Parketvloerenlegger', 'Parketwacht', 'Pastoor', 'Paswerker', 'Patholoog', 'Patholoog-anatoom', 'Patissier', 'Patroonmaker', 'Patroontekenaar', 'Pedagoog', 'Pedicure', 'Perronopzichter', 'Perser', 'Personeelsfunctionaris', 'Peuterwerker', 'Pianist', 'Pianostemmer', 'Piccolo', 'Pijpfitter', 'Pikeur', 'Piloot', 'Plaatwerker', 'Planner', 'Plantenteeltdeskundige', 'Plantsoenmedewerker', 'Plasticvormer', 'Pleitbezorger', 'Poelier', 'Poepruimer', 'Poetser', 'Podiatrist', 'Podoloog', 'Poffertjesbakker', 'Polisopmaker', 'Politicus', 'Politieagent', 'Politiecommissaris', 'Politie-inspecteur', 'Politiek analist', 'Pontschipper', 'Porder', 'Portier', 'Portretfotograaf', 'Postbediende', 'Postbesteller', 'Postbode', 'Postcommandant', 'Postexpediteur', 'Postsorteerder', 'Pottenbakker', 'Predikant', 'Premier', 'Presentator', 'President', 'Priester', 'Probleemanalist', 'Procesmanager', 'Procesoperator', 'Procureur', 'Procureur des Konings', 'Producer', 'Productenmaker', 'Productensorteerder', 'Productiebegeleider', 'Productieleider', 'Productiemedewerker', 'Productieplanner', 'Professor', 'Professioneel worstelaar', 'Programmamaker', 'Programmeur', 'Projectadviseur', 'Projectleider', 'Projectmanager', 'Projectontwikkelaar', 'Promovendus', 'Pruikenmaker', 'Psychiater', 'Psychologisch assistent', 'Psycholoog', 'Psychotherapeut', 'Psychomotorisch kindertherapeut', 'Purser', 'Putjesschepper',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\nl_NL\Company.php — Line 30

``php
        'Raadsman', 'Radarwaarnemer', 'Radiotherapeutisch laborant', 'Radiograaf', 'Radiolaborant', 'Radiotechnicus', 'Radiotelegrafist', 'Rangeerder', 'Recensent', 'Receptionist', 'Recherchekundige', 'Rechercheur', 'Rechtbanktekenaar', 'Rechter', 'Reclame-ontwerper', 'Reclameacquisiteur', 'Reclamedeskundige', 'Reclametekenaar', 'Redacteur', 'Redactiechef', 'Regisseur', 'Registeraccountant', 'Reiniger', 'Reinigingsdienstarbeider', 'Reisleider', 'Reisprogrammeur', 'Reisverkoper', 'Rekenaar', 'Rekwisietenmaker', 'Rentmeester', 'Reparateur', 'Ridder', 'Repetitor', 'Reproductietekenaar', 'Restauranthouder', 'Rietmeubelmaker', 'Rietwerker', 'Rijtuigspuiter', 'Rijwielhersteller', 'Rolluikentimmerman', 'Rondvaartgids', 'Röntgenoloog', 'Ruimtevaarder',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\nl_NL\Company.php — Line 32

``php
        'Takelaar', 'Tandarts', 'Tandartsassistente', 'Tandtechnicus', 'Tapper', 'Taxichauffeur', 'Taxidermist', 'Technicus', 'Technisch Oogheelkundig Assistent', 'Technisch tekenaar', 'Tegelzetter', 'Tekenaar', 'Tekstschrijver', 'Telecommunicatiemonteur', 'Telefoniste', 'Telegrafist', 'Televisieregisseur', 'Televisietechnicus', 'Telexist', 'Tennisser', 'Terrazzovloerenlegger', 'Terreinchef', 'Tester', 'Textieldrukker', 'Textiellaborant', 'Textielopmaker', 'Textielproductenmaker', 'Theateragent', 'Theatertechnicus', 'Therapeut', 'Timmerman', 'Tingieter', 'Toetsenist', 'Tolk', 'Toneelfigurant', 'Toneelmeester', 'Toneelregisseur', 'Toneelschrijver', 'Toneelspeler', 'Torenkraanmonteur', 'Totalisatormedewerker', 'Touringcarchauffeur', 'Touwslager', 'Traceur', 'Trainingsacteur', 'Traiteur', 'Trambestuurder', 'Transportplanner', 'Treinbestuurder', 'Treinconducteur', 'Treindienstleider', 'Treinduwer', 'Treinmachinist', 'Trekkerchauffeur', 'Tuiger', 'Tuinarchitect', 'Tuinder', 'Tuinman', 'Typiste',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\nl_NL\Company.php — Line 45

``php
    protected static $product = [
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\nl_NL\Company.php — Line 77

``php
                $companyName = static::randomElement(static::$product) . ' ' . static::randomElement(static::$type);
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\nl_NL\Company.php — Line 82

``php
                $companyName = static::randomElement(static::$product) . strtolower(static::randomElement(static::$type));
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\nl_NL\Text.php — Line 1878

``php
om zijn akelige knoeierige reproductie dier heerlijkheid. Bavink
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\pl_PL\Text.php — Line 2742

``php
    any commercial products without permission.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\pl_PL\Text.php — Line 2789

``php
    with the production and distribution of Project Gutenberg-tm
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\pl_PL\Text.php — Line 2861

``php
    they hardware or software or any other related product without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\pt_BR\Text.php — Line 3318

``php
    production, promotion and distribution of Project Gutenberg-tm
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\ro_MD\Text.php — Line 2199

``php
    of this License including without limitation any production in the
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\ru_RU\Text.php — Line 4284

``php
    of this License including without limitation any production in the
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\sk_SK\Company.php — Line 27

``php
            'implement', 'utilize', 'integrate', 'streamline', 'optimize', 'evolve', 'transform', 'embrace', 'enable', 'orchestrate', 'leverage', 'reinvent', 'aggregate', 'architect', 'enhance', 'incentivize', 'morph', 'empower', 'envisioneer', 'monetize', 'harness', 'facilitate', 'seize', 'disintermediate', 'synergize', 'strategize', 'deploy', 'brand', 'grow', 'target', 'syndicate', 'synthesize', 'deliver', 'mesh', 'incubate', 'engage', 'maximize', 'benchmark', 'expedite', 'reintermediate', 'whiteboard', 'visualize', 'repurpose', 'innovate', 'scale', 'unleash', 'drive', 'extend', 'engineer', 'revolutionize', 'generate', 'exploit', 'transition', 'e-enable', 'iterate', 'cultivate', 'matrix', 'productize', 'redefine', 'recontextualize',
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\fakerphp\faker\src\Faker\Provider\uk_UA\Text.php — Line 4245

``php
    of this License including without limitation any production in the
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\guzzlehttp\psr7\src\MessageTrait.php — Line 341

``php
        // The regular expression intentionally does not support the obs-fold production, because as
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\config\app.php — Line 32

``php
    'env' => env('APP_ENV', 'production'),
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\config-stubs\app.php — Line 29

``php
    'env' => env('APP_ENV', 'production'),
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Collections\Arr.php — Line 149

``php
            foreach ($results as $product) {
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Collections\Arr.php — Line 151

``php
                    $product[$index] = $item;
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Collections\Arr.php — Line 153

``php
                    $append[] = $product;
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Console\ConfirmableTrait.php — Line 12

``php
     * This method only asks for confirmation in production.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Console\ConfirmableTrait.php — Line 20

``php
    public function confirmToProceed($warning = 'Application In Production', $callback = null)
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Console\ConfirmableTrait.php — Line 53

``php
            return $this->getLaravel()->environment() === 'production';
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Database\Console\WipeCommand.php — Line 127

``php
            ['force', null, InputOption::VALUE_NONE, 'Force the operation to run when in production'],
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Database\Console\Migrations\FreshCommand.php — Line 146

``php
            ['force', null, InputOption::VALUE_NONE, 'Force the operation to run when in production'],
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Database\Console\Migrations\MigrateCommand.php — Line 31

``php
                {--force : Force the operation to run when in production}
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Database\Console\Migrations\RefreshCommand.php — Line 155

``php
            ['force', null, InputOption::VALUE_NONE, 'Force the operation to run when in production'],
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Database\Console\Migrations\ResetCommand.php — Line 86

``php
            ['force', null, InputOption::VALUE_NONE, 'Force the operation to run when in production'],
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Database\Console\Migrations\RollbackCommand.php — Line 84

``php
            ['force', null, InputOption::VALUE_NONE, 'Force the operation to run when in production'],
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Database\Console\Seeds\SeedCommand.php — Line 138

``php
            ['force', null, InputOption::VALUE_NONE, 'Force the operation to run when in production'],
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Filesystem\FilesystemServiceProvider.php — Line 109

``php
                $isProduction = $app->isProduction();
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Filesystem\FilesystemServiceProvider.php — Line 111

``php
                Route::get($uri.'/{path}', function (Request $request, string $path) use ($disk, $config, $isProduction) {
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Filesystem\FilesystemServiceProvider.php — Line 115

``php
                        $isProduction
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Filesystem\FilesystemServiceProvider.php — Line 119

``php
                Route::put($uri.'/{path}', function (Request $request, string $path) use ($disk, $config, $isProduction) {
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Filesystem\FilesystemServiceProvider.php — Line 123

``php
                        $isProduction
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Filesystem\ReceiveFile.php — Line 18

``php
        protected bool $isProduction,
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Filesystem\ReceiveFile.php — Line 30

``php
            $this->isProduction ? 404 : 403
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Filesystem\ServeFile.php — Line 17

``php
        protected bool $isProduction,
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Filesystem\ServeFile.php — Line 29

``php
            $this->isProduction ? 404 : 403
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Foundation\Application.php — Line 778

``php
     * Determine if the application is in the production environment.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Foundation\Application.php — Line 782

``php
    public function isProduction()
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Foundation\Application.php — Line 784

``php
        return $this['env'] === 'production';
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Foundation\Bootstrap\LoadConfiguration.php — Line 61

``php
        $app->detectEnvironment(fn () => $config->get('app.env', 'production'));
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Foundation\Console\KeyGenerateCommand.php — Line 23

``php
                    {--force : Force the operation to run when in production}';
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Log\LogManager.php — Line 592

``php
        return $this->app->bound('env') ? $this->app->environment() : 'production';
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Queue\Listener.php — Line 117

``php
        // just run under the production environment which is not always right.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Queue\Console\ClearCommand.php — Line 121

``php
            ['force', null, InputOption::VALUE_NONE, 'Force the operation to run when in production'],
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\Support\Facades\App.php — Line 41

``php
 * @method static bool isProduction()
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\View\Compilers\Concerns\CompilesConditionals.php — Line 74

``php
     * Compile the production statements into valid PHP.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\View\Compilers\Concerns\CompilesConditionals.php — Line 78

``php
    protected function compileProduction()
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\View\Compilers\Concerns\CompilesConditionals.php — Line 80

``php
        return "<?php if(app()->environment('production')): ?>";
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\View\Compilers\Concerns\CompilesConditionals.php — Line 84

``php
     * Compile the end-production statements into valid PHP.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\framework\src\Illuminate\View\Compilers\Concerns\CompilesConditionals.php — Line 88

``php
    protected function compileEndProduction()
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\laravel\sanctum\config\sanctum.php — Line 17

``php
    | and production domains which access your API via a frontend SPA.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\monolog\monolog\src\Monolog\Formatter\LogstashFormatter.php — Line 19

``php
 * @see https://www.elastic.co/products/logstash
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\monolog\monolog\src\Monolog\Handler\SamplingHandler.php — Line 22

``php
 * a production environment where you only need an idea of what is happening
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\nikic\php-parser\lib\PhpParser\ParserAbstract.php — Line 79

``php
    /** @var array<int, string> Names of the production rules (only necessary for debugging) */
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\nikic\php-parser\lib\PhpParser\ParserAbstract.php — Line 80

``php
    protected array $productions;
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\nikic\php-parser\lib\PhpParser\ParserAbstract.php — Line 362

``php
                        // Empty productions use the start attributes of the lookahead token.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\nikic\php-parser\lib\PhpParser\ParserAbstract.php — Line 546

``php
        echo '% Reduce by (' . $n . ') ' . $this->productions[$n] . "\n";
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\nikic\php-parser\lib\PhpParser\Internal\TokenPolyfill.php — Line 223

``php
        // Based on semi_reserved production.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\Autocompleter.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\AutocompleterAggregate.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\AutocompleterPath.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\AutocompleterWord.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\Console.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\ConsoleCursor.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\ConsoleException.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\ConsoleInput.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\ConsoleOutput.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\ConsoleProcessus.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\ConsoleTput.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\ConsoleWindow.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\Event.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\EventBucket.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\EventException.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\EventListenable.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\EventListener.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\EventListens.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\EventSource.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\Exception.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\ExceptionIdle.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\File.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\FileDirectory.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\FileDoesNotExistException.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\FileException.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\FileFinder.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\FileGeneric.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\FileLink.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\FileLinkRead.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\FileLinkReadWrite.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\FileRead.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\FileReadWrite.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\IStream.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\IteratorFileSystem.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\IteratorRecursiveDirectory.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\IteratorSplFileInfo.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\Protocol.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\ProtocolException.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\ProtocolNode.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\ProtocolNodeLibrary.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\ProtocolWrapper.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\Readline.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\Stream.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\StreamBufferable.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\StreamContext.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\StreamException.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\StreamIn.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\StreamLockable.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\StreamOut.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\StreamPathable.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\StreamPointable.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\StreamStatable.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\StreamTouchable.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\Ustring.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Hoa\Xcallable.php — Line 21

``php
 *       used to endorse or promote products derived from this software without
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\psy\psysh\src\Readline\Interactive\Pager.php — Line 151

``php
     * Dispatch a single key. Public for testability; production goes
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\ramsey\uuid\src\Math\BrickMathCalculator.php — Line 59

``php
        $product = BigInteger::of($multiplicand->toString());
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\ramsey\uuid\src\Math\BrickMathCalculator.php — Line 62

``php
            $product = $product->multipliedBy($multiplier->toString());
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\ramsey\uuid\src\Math\BrickMathCalculator.php — Line 66

``php
        return new IntegerObject((string) $product);
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\ramsey\uuid\src\Math\CalculatorInterface.php — Line 53

``php
     * Returns the product of all the provided parameters
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\ramsey\uuid\src\Math\CalculatorInterface.php — Line 58

``php
     * @return NumberInterface The product of multiplying all the provided parameters
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\staabm\side-effects-detector\lib\functionMetadata.php — Line 722

``php
	'array_product' => ['hasSideEffects' => false],
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\symfony\http-kernel\Profiler\ProfilerStorageInterface.php — Line 20

``php
 * As the profiler must only be used on non-production servers, the file storage
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\symfony\routing\Generator\ConfigurableRequirementsInterface.php — Line 26

``php
 *   production environment. It should log the mismatch so one can review it.
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\symfony\routing\Generator\ConfigurableRequirementsInterface.php — Line 30

``php
 *   link anyway. So in production environment you should know that params always pass
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\voku\portable-ascii\src\voku\helper\ASCII.php — Line 20

``php
 * - [3] https://ichef.bbci.co.uk/news/976/cpsprodpb/163DD/production/_123510119_hi074310744.jpg "Chernihiv under attack"
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\zircote\swagger-php\src\Annotations\OpenApi.php — Line 227

``php
     * @param string $ref The $ref value; example: "#/components/schemas/Product"
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\zircote\swagger-php\src\Spec\PathItem.php — Line 20

``php
 *   class ProductController {
``
## C:\Dev\GreenTools\apibackendlaravel\vendor\zircote\swagger-php\src\Spec\PathItem.php — Line 21

``php
 *       #[Operation\Get(path: '/products/{id}')]
``
