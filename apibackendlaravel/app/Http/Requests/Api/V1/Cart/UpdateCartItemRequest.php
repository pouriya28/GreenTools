<?php

// database/app/Http/Requests/Api/V1/Cart/UpdateCartItemRequest.php

namespace App\Http\Requests\Api\V1\Cart;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
            // Client echoes back the cart version it last saw, to detect stale mutations.
            'version' => ['required', 'integer', 'min:1'],
        ];
    }
}