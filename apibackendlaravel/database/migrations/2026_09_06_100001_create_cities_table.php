<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cities', function (Blueprint $table) {
            $table->id();
            // اگر یک استان حذف شود، شهرهایش هم حذف می‌شوند (داده‌های مرتبط بی‌معنی نمی‌ماند).
            $table->foreignId('province_id')->constrained('provinces')->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->timestamps();

            $table->unique(['province_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cities');
    }
};
