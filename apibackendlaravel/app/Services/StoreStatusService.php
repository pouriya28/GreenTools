<?php

namespace App\Services;

use App\Models\StoreStatus;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StoreStatusService
{
    // همیشه فقط سطر id=1 خوانده/نوشته می‌شود (الگوی singleton row) تا هیچ‌وقت
    // دو وضعیت متناقض هم‌زمان در دیتابیس وجود نداشته باشیم.
    private const SINGLETON_ID = 1;

    public function current(): StoreStatus
    {
        return StoreStatus::query()->firstOrCreate(
            ['id' => self::SINGLETON_ID],
            ['is_open' => true],
        );
    }

    public function isOpen(): bool
    {
        return $this->current()->is_open;
    }

    public function close(User $admin, ?string $reason = null): StoreStatus
    {
        return DB::transaction(function () use ($admin, $reason) {
            // lockForUpdate: اگر دو ادمین هم‌زمان دکمه‌ی بستن/باز کردن را بزنند، قفل می‌شود
            // تا وضعیت نهایی متناقض نشود.
            $status = StoreStatus::query()->lockForUpdate()->firstOrCreate(
                ['id' => self::SINGLETON_ID],
                ['is_open' => true],
            );

            $status->update([
                'is_open' => false,
                'closed_reason' => $reason,
                'closed_by_user_id' => $admin->id,
                'closed_at' => now(),
            ]);

            return $status;
        });
    }

    public function open(User $admin): StoreStatus
    {
        return DB::transaction(function () use ($admin) {
            $status = StoreStatus::query()->lockForUpdate()->firstOrCreate(
                ['id' => self::SINGLETON_ID],
                ['is_open' => true],
            );

            $status->update([
                'is_open' => true,
                'closed_reason' => null,
                'closed_by_user_id' => $admin->id,
                'closed_at' => null,
            ]);

            return $status;
        });
    }
}
