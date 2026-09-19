<?php

namespace App\Http\Requests\Api\V1\Loyalty;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GrantLoyaltyPointsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('loyalty.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'string', Rule::exists('users', 'id')],
            'points' => ['required', 'integer', 'min:1', 'max:100000'],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.exists' => 'کاربر انتخاب‌شده یافت نشد.',
            'points.min' => 'مقدار امتیاز باید حداقل ۱ باشد.',
        ];
    }
}