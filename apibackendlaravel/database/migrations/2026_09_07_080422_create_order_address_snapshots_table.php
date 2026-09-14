<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_address_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('address_id')->nullable()->constrained('addresses')->nullOnDelete();

            $table->string('recipient_name');
            $table->string('recipient_phone', 15);

            $table->foreignId('province_id')->nullable()->constrained('provinces')->nullOnDelete();
            $table->foreignId('city_id')->nullable()->constrained('cities')->nullOnDelete();

            $table->string('province_name');
            $table->string('city_name');
            $table->string('district')->nullable();

            $table->string('postal_code', 10)->nullable();
            $table->text('address_line');

            $table->string('plaque', 20)->nullable();
            $table->string('unit', 20)->nullable();

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_address_snapshots');
    }
};
