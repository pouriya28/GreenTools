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
            'category_id' => ['required', 'string', 'exists:categories,id'],
            'name' => ['required', 'string', 'min:2', 'max:200'],
            'sku' => ['nullable', 'string', 'max:64', 'unique:products,sku', 'alpha_dash'],
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
            'purchase_requirement' => ['nullable', 'in:standard,technical_consultation,professional_installation,restricted'],
            'technical_notice' => ['nullable', 'string', 'max:500'],
            'installation_notice' => ['nullable', 'string', 'max:500'],
            'compatibility_notice' => ['nullable', 'string', 'max:500'],
            'support_contact_enabled' => ['nullable', 'boolean'],
            'purchase_confirmation_required' => ['nullable', 'boolean'],

            'meta' => ['nullable', 'array'],
            'meta.meta_title' => ['nullable', 'string', 'max:180'],
            'meta.meta_description' => ['nullable', 'string', 'max:300'],
            'tag_ids' => ['nullable', 'array', 'max:50'],
            'tag_ids.*' => ['integer', 'distinct', 'exists:tags,id'],
            'attributes' => ['sometimes', 'array'],
            'attributes.*.attribute_id' => ['nullable', 'string', 'exists:attributes,id'],
            'attributes.*.name' => ['nullable', 'string', 'max:100', 'required_without:attributes.*.attribute_id'],
            'attributes.*.unit' => ['nullable', 'string', 'max:30'],
            'attributes.*.value' => ['required', 'string', 'max:500'],
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