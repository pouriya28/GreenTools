<?php

namespace App\Http\Requests\Api\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class SetOperationPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Defense-in-depth: علاوه بر middleware، در Request هم تأیید می‌کنیم
        return $this->user()?->isStaff() === true;
    }

    public function rules(): array
    {
        $user = $this->user();

        return [
            // نیاز به login password: بدون آن، یک session دزدیده‌شده کافی می‌شد برای تغییر operation password
            'current_login_password' => ['required', 'string'],

            'operation_password' => [
                'required',
                'string',
                'confirmed',
                // حداقل ۱۲ کاراکتر — operation password نقش step-up دارد، پس باید قوی‌تر از login باشد
                Password::min(12)->letters()->numbers(),
                // 🔒 operation password نمی‌تواند همان login password باشد
                // در غیر این صورت step-up عملاً هیچ لایه‌ی امنیتی اضافه نمی‌کند
                function (string $attribute, mixed $value, \Closure $fail) use ($user): void {
                    if ($user && Hash::check($value, $user->password)) {
                        $fail('رمز تأیید عملیات نمی‌تواند همان رمز ورود باشد.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'current_login_password.required' => 'برای این عملیات باید رمز ورود فعلی خود را وارد کنید.',
            'operation_password.required'      => 'وارد کردن رمز تأیید عملیات الزامی است.',
            'operation_password.confirmed'     => 'تکرار رمز تأیید عملیات مطابقت ندارد.',
        ];
    }
}
