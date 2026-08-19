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
