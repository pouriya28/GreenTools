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