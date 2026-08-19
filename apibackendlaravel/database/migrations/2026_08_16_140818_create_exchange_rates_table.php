<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->decimal('rate', 12, 4); // تومان به ازای ۱ دلار
            $table->string('source', 50)->default('navasan');
            $table->timestamp('fetched_at');
            // applied | rejected_anomaly | rejected_invalid
            $table->string('status', 20)->default('applied');
            $table->text('note')->nullable(); // دلیل رد شدن، اگه رد شده باشه
            $table->text('raw_response')->nullable(); // برای audit/دیباگ - چیز حساسی توش نیست
            $table->timestamps();

            $table->index(['status', 'fetched_at']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE exchange_rates ADD CONSTRAINT exchange_rates_rate_positive CHECK (rate > 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_rates');
    }
};