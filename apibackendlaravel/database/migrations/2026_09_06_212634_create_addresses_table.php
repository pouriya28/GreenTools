<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->ulid('id');
            $table->primary('id');
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();

            $table->string('title')->nullable();
            $table->string('recipient_name');
            $table->string('recipient_phone', 15);

            $table->foreignId('province_id')->constrained('provinces')->restrictOnDelete();
            $table->foreignId('city_id')->constrained('cities')->restrictOnDelete();
            $table->string('district')->nullable();

            $table->string('postal_code', 10)->nullable();
            $table->text('address_line');

            $table->string('plaque', 20)->nullable();
            $table->string('unit', 20)->nullable();

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->string('map_provider', 20)->nullable();
            $table->string('map_place_id')->nullable();

            $table->boolean('is_default')->default(false);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'is_default']);
            $table->index(['province_id', 'city_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
