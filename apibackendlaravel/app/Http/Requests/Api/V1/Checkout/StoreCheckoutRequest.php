<?php

namespace App\Http\Requests\Api\V1\Checkout;

use Illuminate\Foundation\Http\FormRequest;

class StoreCheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        // احراز هویت واقعی توسط میدل‌ور auth:sanctum و مالکیت سبد توسط current_cart
        // (که در attributes قرار می‌گیرد) تضمین می‌شود؛ اینجا فقط لاگین‌بودن کافیست.
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'address_id' => ['required', 'integer'],
        ];
    }
}
