<?php

namespace App\Http\Requests\Api\V1\Cart;

use Illuminate\Foundation\Http\FormRequest;

class AddCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Ownership is enforced by ResolveCart/ValidateCartOwnership middleware, not here.
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
            'purchase_confirmed' => ['sometimes', 'boolean'],
        ];
    }
}