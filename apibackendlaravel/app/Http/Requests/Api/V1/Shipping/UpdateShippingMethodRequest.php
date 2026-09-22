<?php
// app/Http/Requests/Api/V1/Shipping/UpdateShippingMethodRequest.php

namespace App\Http\Requests\Api\V1\Shipping;

use App\Enums\ShippingCalculationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateShippingMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('shippingMethod'));
    }

    public function rules(): array
    {
        $shippingMethodId = $this->route('shippingMethod')->id;

        return [
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:150'],
            'code' => ['sometimes', 'required', 'string', 'alpha_dash', 'max:32', Rule::unique('shipping_methods', 'code')->ignore($shippingMethodId)],
            'base_cost' => ['sometimes', 'required', 'integer', 'min:0', 'max:100000000'],
            'calculation_type' => ['sometimes', 'required', Rule::enum(ShippingCalculationType::class)],
            'cost_per_kg' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'min_weight_grams' => ['nullable', 'integer', 'min:0'],
            'max_weight_grams' => ['nullable', 'integer', 'gte:min_weight_grams'],
            'free_shipping_enabled' => ['sometimes', 'required', 'boolean'],
            'free_shipping_threshold' => ['nullable', 'integer', 'min:1'],
            'estimated_days_min' => ['nullable', 'integer', 'min:0', 'max:60'],
            'estimated_days_max' => ['nullable', 'integer', 'gte:estimated_days_min', 'max:60'],
            'is_active' => ['sometimes', 'required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}