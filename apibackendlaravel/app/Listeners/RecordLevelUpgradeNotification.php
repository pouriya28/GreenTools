<?php

namespace App\Listeners;

use App\Events\LevelUpgraded;
use Illuminate\Support\Facades\Log;

class RecordLevelUpgradeNotification
{
    /**
     * Intentionally minimal for now — just logs the upgrade. Once the final
     * notification channel (in-app / SMS / email) is decided, only the body
     * of this method needs to change; the LevelUpgraded event contract stays
     * stable so nothing upstream is affected.
     */
    public function handle(LevelUpgraded $event): void
    {
        Log::info('loyalty.level_upgraded', [
            'user_id' => $event->user->id,
            'previous_level_id' => $event->previousLevelId,
            'new_level_id' => $event->newLevelId,
        ]);
    }
}