<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

/**
 * One-off seeder: creates the pricing-related permissions (if missing) and
 * grants them to one admin/staff account, identified by email.
 *
 * Grants:
 *  - exchange-rates.manage  (NEW - required by ManualExchangeRateOverrideRequest::authorize(),
 *                             ExchangeRateOverrideController::confirmCurrent()/fetchNow(), and
 *                             ExchangeRateScheduleController; this is now the single dedicated
 *                             permission for the whole "exchange rate management" side, fully
 *                             separate from product price review)
 *  - prices.review          (required by ProductPriceProposalPolicy::viewAny(), to view/approve/
 *                             reject product price proposals - the "product price update" side)
 *  - prices.manual_override (legacy - kept granted for backward compatibility with any code that
 *                             still checks it, but the override endpoint itself now checks
 *                             exchange-rates.manage instead)
 *
 * Usage:
 *   GRANT_PRICING_PERMS_TO_EMAIL=admin@example.com php artisan db:seed \
 *     --class=GrantPricesManualOverridePermissionSeeder
 *
 * Or edit the fallback email below and run without the env var.
 */
class GrantPricesManualOverridePermissionSeeder extends Seeder
{
    private const PERMISSION_NAMES = [
        'exchange-rates.manage',
        'prices.review',
        'prices.manual_override',
    ];

    public function run(): void
    {
        $adminEmail = env('GRANT_PRICING_PERMS_TO_EMAIL', 'ADMIN_EMAIL_HERE');

        $user = User::where('email', $adminEmail)->first();

        if (! $user) {
            $this->command?->error("No user found with email {$adminEmail}; permissions were created (if missing) but not granted to anyone.");
        }

        foreach (self::PERMISSION_NAMES as $name) {
            // The permission's guard_name must match User::$guard_name ('sanctum').
            // A permission created with the default 'web' guard would silently
            // never match $user->can(...) on this app.
            $permission = Permission::firstOrCreate([
                'name' => $name,
                'guard_name' => 'sanctum',
            ]);

            if (! $user) {
                continue;
            }

            if ($user->hasPermissionTo($permission)) {
                $this->command?->info("{$adminEmail} already has {$name}.");
                continue;
            }

            $user->givePermissionTo($permission);
            $this->command?->info("Granted {$name} to {$adminEmail}.");
        }
    }
}
