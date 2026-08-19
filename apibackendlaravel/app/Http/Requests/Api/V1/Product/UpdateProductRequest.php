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
