<?php
// app/Http/Requests/Api/V1/Admin/GenerateShippingLabelsRequest.php

namespace App\Http\Requests\Api\V1\Admin;

use App\Enums\OrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenerateShippingLabelsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', \App\Models\Order::class);
    }

    public function rules(): array
    {
        return [
            'order_ids' => ['required_without:status', 'array', 'max:200'],
            'order_ids.*' => ['string', 'exists:orders,id'],
            'status' => [
                'required_without:order_ids',
                'string',
                // فقط سفارش‌هایی که هنوز در مسیر ارسال‌ان — قبل از پرداخت
                // (pending_payment) یا بعد از تحویل/لغو (delivered/cancelled)
                // اینجا معنی ندارد چون یا آدرسی برای ارسال قطعی نیست، یا
                // فرآیند ارسال قبلاً تمام شده.
                Rule::in([
                    OrderStatus::Paid->value,
                    OrderStatus::Processing->value,
                    OrderStatus::Packed->value,
                    OrderStatus::Shipped->value,
                ]),
            ],
            'sender_address_id' => ['required', 'integer', 'exists:sender_addresses,id'],
            'paper_size' => ['required', Rule::in(['a4', 'a5'])],
            'label_size' => ['required', Rule::in(['10x15', '10x10'])],
            'copies_per_order' => ['sometimes', 'integer', 'min:1', 'max:10'],
        ];
    }

    public function messages(): array
    {
        return [
            'order_ids.max' => 'حداکثر ۲۰۰ سفارش در هر درخواست قابل چاپ است.',
        ];
    }
}