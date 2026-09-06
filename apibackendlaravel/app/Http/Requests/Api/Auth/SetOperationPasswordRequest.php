<?php

namespace App\Http\Requests\Api\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class SetOperationPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Gate is handled at the route level (auth:sanctum + staff.access);
        // any authenticated staff member may set their OWN operation password.
        return true;
    }

    public function rules(): array
    {
        return [
            // Requiring the LOGIN password here is deliberate: without it, a
            // hijacked-but-still-valid access token would be enough to set or
            // silently replace the operation password, defeating its purpose.
            'current_login_password' => ['required', 'string'],
            'operation_password' => [
                'required', 'string', 'confirmed',
                Password::min(8)->letters()->numbers(),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'current_login_password.required' => 'برای این عملیات باید رمز ورود فعلی خود را وارد کنید.',
            'operation_password.required' => 'وارد کردن رمز تأیید عملیات الزامی است.',
            'operation_password.confirmed' => 'تکرار رمز تأیید عملیات مطابقت ندارد.',
        ];
    }
}