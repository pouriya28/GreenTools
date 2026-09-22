<?php
// app/Http/Requests/Api/V1/Order/UpdateOrderStatusRequest.php

namespace App\Http\Requests\Api\V1\Order;

use App\Enums\OrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(array_column(OrderStatus::cases(), 'value'))],
            // Required only when the admin is marking the order as shipped —
            // there is no meaningful tracking code before that point.
            'tracking_code' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf($this->input('status') === OrderStatus::Shipped->value),
            ],
        ];
    }
}