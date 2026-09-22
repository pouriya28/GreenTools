<?php

namespace App\Http\Resources;

use App\Support\Html\ProductDescriptionSanitizer;
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
            'short_description' => app(ProductDescriptionSanitizer::class)->sanitize($this->short_description),
            'description' => app(ProductDescriptionSanitizer::class)->sanitize($this->description),

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


            'purchase_requirement' => $this->purchase_requirement?->value,
            'purchase_requirement_label' => $this->purchase_requirement?->label(),
            'technical_notice' => $this->technical_notice,
            'installation_notice' => $this->installation_notice,
            'compatibility_notice' => $this->compatibility_notice,
            'support_contact_enabled' => $this->support_contact_enabled,
            'purchase_confirmation_required' => $this->purchase_confirmation_required,

            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
            'views_count' => $this->views_count,
            'purchases_count' => $this->purchases_count,
            'likes_count' => $this->likes_count,

            'category' => new CategoryResource($this->whenLoaded('category')),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'videos' => ProductVideoResource::collection($this->whenLoaded('videos')),
            'attributes' => AttributeValueResource::collection($this->whenLoaded('attributeValues')),
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}