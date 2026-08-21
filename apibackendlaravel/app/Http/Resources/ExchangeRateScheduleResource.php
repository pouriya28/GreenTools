<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExchangeRateScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'frequency' => $this->frequency,
            'run_time' => $this->run_time,
            'days_of_week' => $this->days_of_week,
            'days_of_month' => $this->days_of_month,
            'is_active' => $this->is_active,
            'last_triggered_at' => optional($this->last_triggered_at)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
