<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Fully independent from the login password — separate hash,
            // separate verification flow, separate failure/lockout handling.
            $table->string('operation_password_hash')->nullable()->after('two_factor_enabled');

            // Points only ever increase in the current business model — see
            // LoyaltyService, which is the single sanctioned writer of this column.
            $table->unsignedInteger('loyalty_points')->default(0)->after('operation_password_hash');

            $table->foreignUlid('customer_level_id')->nullable()->after('loyalty_points')
                ->constrained('customer_levels')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_level_id');
            $table->dropColumn(['operation_password_hash', 'loyalty_points']);
        });
    }
};
