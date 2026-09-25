<?php

namespace App\Http\Requests\Api\V1\Checkout;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Real auth is enforced by auth:sanctum middleware and cart ownership
        // by ResolveCart; here we only need the user to be authenticated.
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'address_id' => ['required', 'string'],

            // Only active shipping methods are selectable; an inactive/deleted
            // method is rejected here and again inside CheckoutService.
            'shipping_method_id' => [
                'required',
                'string',
                Rule::exists('shipping_methods', 'id')->where(
                    fn ($query) => $query->where('is_active', true)
                ),
            ],

            // The slug must correspond to a configured payment gateway.
            // We validate against the keys defined in config/payments.php so
            // that an unknown or disabled gateway never reaches CheckoutService.
            'gateway' => [
                'required',
                'string',
                Rule::in(array_keys(config('payments.gateways', []))),
            ],
        ];
    }
}
