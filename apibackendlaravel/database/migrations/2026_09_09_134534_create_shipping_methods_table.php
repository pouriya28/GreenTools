<?php
// database/migrations/xxxx_xx_xx_create_shipping_methods_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_methods', function (Blueprint $table) {
            $table->ulid('id');
            $table->primary('id');
            
            $table->string('name');
            $table->string('code')->unique();
            $table->unsignedInteger('base_cost')->default(0);
            // Stores ShippingCalculationType enum value: fixed | weight | weight_zone.
            // weight_zone is reserved for Phase 3 and intentionally not implemented
            // in ManualShippingCalculator yet.
            $table->string('calculation_type', 32)->default('fixed');
            $table->unsignedInteger('cost_per_kg')->nullable();
            $table->unsignedInteger('min_weight_grams')->nullable();
            $table->unsignedInteger('max_weight_grams')->nullable();
            $table->boolean('free_shipping_enabled')->default(false);
            $table->unsignedInteger('free_shipping_threshold')->nullable();
            $table->unsignedInteger('estimated_days_min')->nullable();
            $table->unsignedInteger('estimated_days_max')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipping_methods');
    }
};
