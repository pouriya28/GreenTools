<?php
// app/Http/Requests/Api/V1/Admin/UpdateSenderAddressRequest.php

namespace App\Http\Requests\Api\V1\Admin;

class UpdateSenderAddressRequest extends StoreSenderAddressRequest
{
    public function rules(): array
    {
        return array_map(
            fn ($rule) => array_map(fn ($r) => $r === 'required' ? 'sometimes' : $r, $rule),
            parent::rules(),
        );
    }
}