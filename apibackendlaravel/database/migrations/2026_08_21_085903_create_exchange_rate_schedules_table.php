<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exchange_rate_schedules', function (Blueprint $table) {
            $table->id();
            $table->enum('frequency', ['daily', 'weekly', 'monthly']);
            $table->time('run_time');
            // weekly: [0-6] (Carbon dayOfWeek, 0=یکشنبه). monthly: [1-31].
            $table->json('days_of_week')->nullable();
            $table->json('days_of_month')->nullable();
            $table->boolean('is_active')->default(true);
            // جلوگیری از اجرای دوباره در همان دقیقه/روز اگر scheduler بیشتر از یک‌بار اجرا شود.
            $table->timestamp('last_triggered_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_rate_schedules');
    }
};
