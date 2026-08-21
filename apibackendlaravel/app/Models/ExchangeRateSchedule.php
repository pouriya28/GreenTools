<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExchangeRateSchedule extends Model
{
    protected $fillable = [
        'frequency', 'run_time', 'days_of_week', 'days_of_month',
        'is_active', 'last_triggered_at', 'created_by',
    ];

    protected $casts = [
        'days_of_week' => 'array',
        'days_of_month' => 'array',
        'is_active' => 'boolean',
        'last_triggered_at' => 'datetime',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * آیا این زمان‌بندی دقیقاً در همین دقیقه باید اجرا شود ، فقط ساعت
     * (run_time) و - در صورت weekly/monthly - تطبیق روز را چک می‌کند. جلوگیری
     * از اجرای دوباره در همان دقیقه/روز، مسؤولیت RunDueExchangeRateSchedules
     * (فیلد last_triggered_at) است، نه این متد.
     */
    public function isDueAt(\Carbon\Carbon $now): bool
    {
        $runTime = \Carbon\Carbon::parse($this->run_time);

        if ($now->format('H:i') !== $runTime->format('H:i')) {
            return false;
        }

        return match ($this->frequency) {
            'daily' => true,
            'weekly' => in_array($now->dayOfWeek, $this->days_of_week ?? [], true),
            'monthly' => in_array($now->day, $this->days_of_month ?? [], true),
            default => false,
        };
    }
}
