<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage', Product::class) ?? false;
    }

    public function rules(): array
    {
        return [
            // چندتایی: فرانت می‌تونه چند فایل هم‌زمان با کلید images[] بفرسته
            'images' => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => [
                'required',
                'image', // این قانون خودِ لاراول محتوای واقعی فایل رو با fileinfo چک می‌کنه، نه فقط پسوند
                'mimes:jpg,jpeg,png,webp',
                'max:5120', // حداکثر ۵ مگابایت
                'dimensions:min_width=200,min_height=200,max_width=6000,max_height=6000',
            ],
            'alt_texts' => ['nullable', 'array'],
            'alt_texts.*' => ['nullable', 'string', 'max:200'],
        ];
    }

    public function messages(): array
    {
        return [
            'images.*.mimes' => 'فقط فرمت‌های jpg، png و webp مجاز هستند.',
            'images.*.max' => 'حجم هر عکس نباید بیشتر از ۵ مگابایت باشد.',
            'images.*.dimensions' => 'ابعاد عکس باید بین ۲۰۰×۲۰۰ تا ۶۰۰۰×۶۰۰۰ پیکسل باشد.',
        ];
    }
}