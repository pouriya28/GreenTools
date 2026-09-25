<?php

namespace App\Http\Requests\Api\V1\Pricing;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePriceProposalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'edited_price_toman' => ['required', 'integer', 'min:0'],
        ];
    }
}