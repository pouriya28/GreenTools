<?php

namespace App\Http\Requests\Api\V1\Pricing;

use Illuminate\Foundation\Http\FormRequest;

class ManualExchangeRateOverrideRequest extends FormRequest
{
    // Fallback فقط برای زمانی که config('services.navasan.min_sane_rate/max_sane_rate')
    // تنظیم نشده باشد. در حالت عادی همان بازه‌ای که NavasanExchangeRateProvider
    // برای اعتبارسنجی نرخ دریافتی خودکار استفاده می‌کند، اینجا هم اعمال می‌شود تا
    // ادمین نتواند نرخی خارج از بازه‌ی منطقی ثبت کند.
    private const FALLBACK_MIN_SANE_RATE = 1;
    private const FALLBACK_MAX_SANE_RATE = 999999999;

    public function authorize(): bool
    {
        // permission کاملاً مجزا از prices.review/products.*  طبق تصمیم تایید‌شده.
        return $this->user()?->can('prices.manual_override') ?? false;
    }

    public function rules(): array
    {
        $min = (float) (config('services.navasan.min_sane_rate') ?? self::FALLBACK_MIN_SANE_RATE);
        $max = (float) (config('services.navasan.max_sane_rate') ?? self::FALLBACK_MAX_SANE_RATE);

        return [
            'rate' => ['required', 'numeric', "min:{$min}", "max:{$max}"],
            'reason' => ['required', 'string', 'min:10', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'برای override دستی نرخ، ذکر دلیل الزامی است.',
            'reason.min' => 'دلیل باید حداقل ۱۰ کاراکتر باشد تا برای audit قابل استفاده باشد.',
            'rate.max' => 'نرخ وارد شده خارج از بازه‌ی منطقی مجاز است.',
        ];
    }
}
