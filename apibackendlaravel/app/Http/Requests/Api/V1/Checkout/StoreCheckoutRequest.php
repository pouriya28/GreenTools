<?php

namespace App\Http\Requests\Api\V1\Checkout;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            // فقط روش ارسال فعال قابل انتخاب است؛ روش غیرفعال/حذف‌شده رد می‌شود
            // (همان دفاعی که در ShippingMethodUnavailableException هم تکرار شده).
            'shipping_method_id' => [
                'required',
                'integer',
                Rule::exists('shipping_methods', 'id')->where(fn ($query) => $query->where('is_active', true)),
            ],
        ];
    }
}