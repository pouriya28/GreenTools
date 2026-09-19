<?php

namespace App\Services\Product;

use App\Models\Product;
use Illuminate\Support\Str;

/**
 * تولید خودکار SKU یکتا برای محصولاتی که ادمین SKU وارد نکرده.
 * از اسم محصول استفاده نمی‌کنیم چون معمولاً فارسیه (alpha_dash با فارسی جور
 * نیست) - به‌جاش یه شناسه‌ی همیشه‌-ASCII بر اساس دسته‌بندی + رشته‌ی تصادفی می‌سازیم.
 */
class SkuGenerator
{
    private const MAX_ATTEMPTS = 5;

    public function generate(string $categoryId): string
    {
        // فقط چند کاراکتر آخر ULID دسته‌بندی رو می‌گیریم تا SKU خیلی طولانی نشه
        // (کل ULID 26 کاراکتره)؛ همچنان به‌اندازه‌ی کافی برای دیباگ/ردیابی گویاست.
        $categorySuffix = strtoupper(substr($categoryId, -6));

        for ($attempt = 0; $attempt < self::MAX_ATTEMPTS; $attempt++) {
            $candidate = sprintf('P%s-%s', $categorySuffix, strtoupper(Str::random(6)));
            // withTrashed چون sku توی مایگریشن unique سطح دیتابیسه و به soft delete
            // توجهی نداره - یه SKU متعلق به محصول حذف‌شده (نرم) هم نباید دوباره صادر بشه.
            if (! Product::withTrashed()->where('sku', $candidate)->exists()) {
                return $candidate;
            }
        }

        // fallback بسیار بعید: بعد از چند تلاش برخورد تصادفی داشتیم
        return 'P'.$categorySuffix.'-'.strtoupper(Str::random(10));
    }
}