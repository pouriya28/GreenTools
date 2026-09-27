<?php

namespace App\Http\Requests\Api\V1\Wishlist;

use Illuminate\Foundation\Http\FormRequest;

class StoreWishlistRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Auth is handled by sanctum.optional middleware on the route.
        // Guests are allowed (guest_token is resolved by ResolveWishlist middleware).
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'string', 'exists:products,id'],
        ];
    }
}
