<?php

namespace App\Http\Requests\Api\V1\Pricing;

use App\Models\ProductPriceProposal;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePriceProposalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reviewAny', ProductPriceProposal::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'edited_price_toman' => ['required', 'integer', 'min:1', 'max:99999999999'],
        ];
    }
}
