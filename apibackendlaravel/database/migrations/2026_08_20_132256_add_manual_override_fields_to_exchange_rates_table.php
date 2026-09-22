<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Guarded with hasColumn() checks because "source" already existed on
    // exchange_rates from the original create_exchange_rates_table migration
    // in this project; only "reason" and "requested_by" were actually new.
    // This makes the migration safe to run regardless of which of the three
    // columns already exist.
    public function up(): void
    {
        Schema::table('exchange_rates', function (Blueprint $table) {
            if (! Schema::hasColumn('exchange_rates', 'source')) {
                $table->enum('source', ['scheduled', 'manual_admin'])->default('scheduled')->after('rate');
            }

            if (! Schema::hasColumn('exchange_rates', 'reason')) {
                $table->string('reason', 500)->nullable()->after('source');
            }

            if (! Schema::hasColumn('exchange_rates', 'requested_by')) {
                $table->foreignUlid('requested_by')->nullable()->after('reason')->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('exchange_rates', function (Blueprint $table) {
            if (Schema::hasColumn('exchange_rates', 'requested_by')) {
                $table->dropConstrainedForeignId('requested_by');
            }

            if (Schema::hasColumn('exchange_rates', 'reason')) {
                $table->dropColumn('reason');
            }

            // "source" is intentionally left alone on rollback since this
            // migration did not create it in this project.
        });
    }
};
