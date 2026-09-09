<?php

namespace App\Http\Requests\Api\V1\Map;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ReverseGeocodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ];
    }

    /**
     * Coarse sanity check that the point is within (a generous box around)
     * Iran. This is a UX/abuse guard, not the only line of defense -- the
     * geocoding provider and downstream province/city resolution still
     * validate the result independently.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $bounds = config('geocoding.iran_bounds');
            $lat = (float) $this->input('latitude');
            $lng = (float) $this->input('longitude');

            $withinBounds = $lat >= $bounds['lat_min'] && $lat <= $bounds['lat_max']
                && $lng >= $bounds['lng_min'] && $lng <= $bounds['lng_max'];

            if (! $withinBounds) {
                $validator->errors()->add('latitude', 'موقعیت انتخابی خارج از محدودهٔ پوششی است.');
            }
        });
    }
}
