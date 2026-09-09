<?php

namespace App\Http\Requests\Api\V1\Address;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title' => ['nullable', 'string', 'max:50'],
            'recipient_name' => ['required', 'string', 'max:100'],
            'recipient_phone' => ['required', 'regex:/^09\d{9}$/'],

            'province_id' => ['required', 'integer', 'exists:provinces,id'],
            'city_id' => [
                'required',
                'integer',
                Rule::exists('cities', 'id')->where('province_id', $this->input('province_id')),
            ],
            'district' => ['nullable', 'string', 'max:100'],

            'postal_code' => ['nullable', 'digits:10'],
            'address_line' => ['required', 'string', 'max:1000'],

            'plaque' => ['nullable', 'string', 'max:20'],
            'unit' => ['nullable', 'string', 'max:20'],

            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],

            'map_provider' => ['nullable', 'in:neshan,mapir'],
            'map_place_id' => ['nullable', 'string', 'max:255'],

            'is_default' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'city_id.exists' => 'شهر انتخابی مربوط به استان انتخابی نیست.',
        ];
    }
}
