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
            'purchase_requirement' => ['sometimes', 'nullable', 'in:standard,technical_consultation,professional_installation,restricted'],
            'technical_notice' => ['nullable', 'string', 'max:500'],
            'installation_notice' => ['nullable', 'string', 'max:500'],
            'compatibility_notice' => ['nullable', 'string', 'max:500'],
            'support_contact_enabled' => ['nullable', 'boolean'],
            'purchase_confirmation_required' => ['nullable', 'boolean'],

            // فیکس شد: قبلاً 'meta_title'/'meta_description' به‌صورت تخت و بدون
            // نستینگ زیر 'meta' تعریف شده بودن - در حالی که ProductService از
            // $data['meta']['meta_title'] (ساختار nested، هماهنگ با Store) استفاده
            // می‌کنه. چون این کلیدها اصلاً با ساختار واقعی داده‌ی ورودی مطابقت
            // نداشتن، validated() هیچ‌وقت 'meta' رو برنمی‌گردوند و ویرایش
            // meta_title/meta_description از فرم ادمین ساکت fail می‌شد.
            'meta' => ['nullable', 'array'],
            'meta.meta_title' => ['nullable', 'string', 'max:180'],
            'meta.meta_description' => ['nullable', 'string', 'max:300'],

            // فیکس شد: در Update اصلاً تعریف نشده بود، پس $request->validated()
            // همیشه tag_ids رو حذف می‌کرد و ProductService::update() هیچ‌وقت
            // syncTags صدا نمی‌زد - یعنی تغییر تگ‌های محصول از فرم ویرایش کار
            // نمی‌کرد (بدون هیچ خطایی، صرفاً بی‌اثر).
            'tag_ids' => ['nullable', 'array', 'max:50'],
            'tag_ids.*' => ['integer', 'distinct', 'exists:tags,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'price_usd.required' => 'قیمت دلاری محصول الزامی است.',
        ];
    }
}