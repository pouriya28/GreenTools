<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_level_benefits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_level_id')
                ->constrained('customer_levels')
                ->cascadeOnDelete();
            $table->string('type', 50); // e.g. free_shipping, discount_code, priority_support
            $table->json('value')->nullable(); // shape depends on `type`, kept flexible on purpose
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['customer_level_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_level_benefits');
    }
};
