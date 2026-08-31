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
            'purchase_requirement' => $this->purchase_requirement?->value,
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
