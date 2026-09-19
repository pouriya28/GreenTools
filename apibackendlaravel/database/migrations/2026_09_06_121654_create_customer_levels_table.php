<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_levels', function (Blueprint $table) {
            $table->ulid('id');
            $table->primary('id');
            $table->string('code', 50)->unique(); // stable machine identifier, never displayed
            $table->string('name', 100);           // Persian display name, safe to rename anytime
            $table->string('icon', 50)->nullable();
            $table->unsignedInteger('min_points');
            $table->unsignedInteger('max_points')->nullable(); // null only allowed on the top level
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_levels');
    }
};
