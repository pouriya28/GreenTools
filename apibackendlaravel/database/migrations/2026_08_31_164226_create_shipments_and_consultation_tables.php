<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->ulid('id');
            
            $table->primary('id');
            $table->foreignUlid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('status')->default('preparing');
            $table->string('tracking_code')->nullable();
            $table->timestamps();
        });

        Schema::create('technical_consultation_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUlid('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->index(['user_id', 'product_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('technical_consultation_requests');
        Schema::dropIfExists('shipments');
    }
};