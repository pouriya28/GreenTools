<?php

namespace App\Http\Requests\Api\V1\Product;

use Illuminate\Foundation\Http\FormRequest;

class ProductIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // دیدن لیست محصولات برای همه آزاده
    }

    public function rules(): array
    {
        return [
            // regex: فقط حروف/عدد/خط‌تیره - جلوگیری از فرمت‌های عجیب قبل از رسیدن به دیتابیس
            'category_slug' => ['nullable', 'string', 'max:230', 'regex:/^[a-z0-9\-]+$/i'],
            'search' => ['nullable', 'string', 'max:100'],
            'min_price' => ['nullable', 'integer', 'min:0'],
            'max_price' => ['nullable', 'integer', 'min:0', 'gte:min_price'],
            'in_stock' => ['nullable', 'boolean'],
            'has_discount' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
            // whitelist دقیق - جلوگیری از SQL injection از طریق sort
            'sort' => ['nullable', 'in:newest,oldest,price_asc,price_desc,most_purchased,most_liked,most_viewed'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'], // جلوگیری از DoS با per_page=999999
            'page' => ['nullable', 'integer', 'min:1', 'max:100000'], // جلوگیری از OFFSET غول‌آسا روی صفحات دور
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['in_stock', 'has_discount', 'is_featured'] as $field) {
            if ($this->has($field)) {
                $this->merge([$field => filter_var($this->query($field), FILTER_VALIDATE_BOOLEAN)]);
            }
        }
    }
}