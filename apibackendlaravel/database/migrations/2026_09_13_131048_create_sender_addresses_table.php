<?php
// database/migrations/2026_09_13_110000_create_sender_addresses_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sender_addresses', function (Blueprint $table) {
            $table->id();
            $table->string('label');          // e.g. "انبار مرکزی تهران"
            $table->string('sender_name');
            $table->string('sender_phone');
            $table->string('province_name');
            $table->string('city_name');
            $table->string('district')->nullable();
            $table->string('postal_code');
            $table->string('address_line');
            $table->string('plaque')->nullable();
            $table->string('unit')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sender_addresses');
    }
};