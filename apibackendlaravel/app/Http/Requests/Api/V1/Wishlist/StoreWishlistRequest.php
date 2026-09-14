<?php
// app/Http/Requests/Api/V1/Wishlist/StoreWishlistRequest.php

namespace App\Http\Requests\Api\V1\Wishlist;

use Illuminate\Foundation\Http\FormRequest;

class StoreWishlistRequest extends FormRequest
{
    public function authorize(): bool
    {
        // محدودسازی واقعی روی کاربر لاگین‌شده از طریق میدل‌ور auth:sanctum
        // در فایل روت انجام می‌شود؛ اینجا فقط یک لایه‌ی دفاعی اضافه است.
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ];
    }
}