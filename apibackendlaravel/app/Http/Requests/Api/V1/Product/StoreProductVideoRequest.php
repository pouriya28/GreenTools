<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductVideoRequest extends FormRequest
{
    private const ALLOWED_HOSTS = [
        'youtube' => ['youtube.com', 'www.youtube.com', 'youtu.be'],
        'aparat' => ['aparat.com', 'www.aparat.com'],
    ];

    public function authorize(): bool
    {
        return $this->user()?->can('manage', Product::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'source_type' => ['required', 'in:youtube,aparat,external'],
            'file' => [
            'required_if:source_type,upload',
            'file',
            'mimetypes:video/mp4,video/webm,video/ogg',
            'max:51200', // ۵۰ مگابایت سقف - جلوی آپلود فایل غول‌آسا رو می‌گیره
            ],
            'external_url' => [
                'required',
                'url',
                'max:500',
                function ($attribute, $value, $fail) {
                    if ($this->input('source_type') === 'upload') return;
                    $sourceType = $this->input('source_type');
                    $host = parse_url($value, PHP_URL_HOST);
                    $allowedHosts = self::ALLOWED_HOSTS[$sourceType] ?? null;

                    if ($allowedHosts && !in_array($host, $allowedHosts, true)) {
                        $fail("لینک وارد شده با پلتفرم انتخاب‌شده ({$sourceType}) مطابقت ندارد.");
                    }
                },
            ],
            'title' => ['nullable', 'string', 'max:200'],
        ];
    }
}