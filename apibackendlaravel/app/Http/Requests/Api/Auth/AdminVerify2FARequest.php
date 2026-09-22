<?php

namespace App\Http\Requests\Api\Auth;

use Illuminate\Foundation\Http\FormRequest;

class AdminVerify2FARequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'totp_code' => ['required', 'string', 'digits:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'totp_code.required' => 'وارد کردن کد تایید الزامی است.',
            'totp_code.digits' => 'کد تایید باید ۶ رقم باشد.',
        ];
    }
}