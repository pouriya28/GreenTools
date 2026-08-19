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
