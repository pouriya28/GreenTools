<?php

namespace App\Http\Requests\Api\V1\StoreStatus;

use Illuminate\Foundation\Http\FormRequest;

class CloseStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        // دفاع دوم: علاوه بر middleware مسیر permission:store.manage-status، اینجا هم چک می‌شود.
        return $this->user()?->can('store.manage-status') ?? false;
    }

    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
