<?php

namespace App\Http\Requests\Api\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendCustomerOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'channel' => ['required', Rule::in(['phone', 'email'])],
            'phone' => ['required_if:channel,phone', 'nullable', 'string', 'regex:/^09[0-9]{9}$/'],
            'email' => ['required_if:channel,email', 'nullable', 'string', 'email:rfc,dns'],
        ];
    }

    public function messages(): array
    {
        return [
            'channel.required' => 'مشخص کنید کد از طریق پیامک یا ایمیل ارسال شود.',
            'channel.in' => 'کانال ارسال باید phone یا email باشد.',
            'phone.required_if' => 'شماره موبایل الزامی است.',
            'phone.regex' => 'فرمت شماره موبایل معتبر نیست (مثال: 09123456789).',
            'email.required_if' => 'ایمیل الزامی است.',
            'email.email' => 'فرمت ایمیل معتبر نیست.',
        ];
    }

    public function identifier(): string
    {
        return $this->string('channel')->value() === 'phone'
            ? (string) $this->input('phone')
            : (string) $this->input('email');
    }
}
