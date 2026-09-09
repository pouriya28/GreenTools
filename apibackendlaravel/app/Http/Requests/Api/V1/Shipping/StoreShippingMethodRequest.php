<?php
// app/Http/Requests/Api/V1/Shipping/StoreShippingMethodRequest.php

namespace App\Http\Requests\Api\V1\Shipping;

use App\Enums\ShippingCalculationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreShippingMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\ShippingMethod::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'code' => ['required', 'string', 'alpha_dash', 'max:32', 'unique:shipping_methods,code'],
            'base_cost' => ['required', 'integer', 'min:0', 'max:100000000'],
            'calculation_type' => ['required', Rule::enum(ShippingCalculationType::class)],
            'cost_per_kg' => ['nullable', 'required_if:calculation_type,weight,weight_zone', 'integer', 'min:0', 'max:10000000'],
            'min_weight_grams' => ['nullable', 'integer', 'min:0'],
            'max_weight_grams' => ['nullable', 'integer', 'gte:min_weight_grams'],
            'free_shipping_enabled' => ['required', 'boolean'],
            'free_shipping_threshold' => ['nullable', 'required_if:free_shipping_enabled,true', 'integer', 'min:1'],
            'estimated_days_min' => ['nullable', 'integer', 'min:0', 'max:60'],
            'estimated_days_max' => ['nullable', 'integer', 'gte:estimated_days_min', 'max:60'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}