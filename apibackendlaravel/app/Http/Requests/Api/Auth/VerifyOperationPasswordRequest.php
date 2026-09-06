<?php

namespace App\Http\Requests\Api\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOperationPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'operation_password' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'operation_password.required' => 'وارد کردن رمز تأیید عملیات الزامی است.',
        ];
    }
}