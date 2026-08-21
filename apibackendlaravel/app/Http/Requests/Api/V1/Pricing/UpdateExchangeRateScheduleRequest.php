<?php

namespace App\Http\Requests\Api\V1\Pricing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExchangeRateScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('exchange-rates.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'frequency' => ['sometimes', Rule::in(['daily', 'weekly', 'monthly'])],
            'run_time' => ['sometimes', 'date_format:H:i'],
            'days_of_week' => ['required_if:frequency,weekly', 'array', 'min:1'],
            'days_of_week.*' => ['integer', 'min:0', 'max:6'],
            'days_of_month' => ['required_if:frequency,monthly', 'array', 'min:1'],
            'days_of_month.*' => ['integer', 'min:1', 'max:31'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'days_of_week.required_if' => 'برای زمان‌بندی هفتگی، حداقل یک روز هفته را انتخاب کنید.',
            'days_of_month.required_if' => 'برای زمان‌بندی ماهانه، حداقل یک روز از ماه را انتخاب کنید.',
        ];
    }
}
