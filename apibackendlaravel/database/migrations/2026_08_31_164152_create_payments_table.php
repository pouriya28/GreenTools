<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('gateway');
            $table->unsignedBigInteger('amount');
            $table->string('status')->default('pending');
            $table->string('transaction_id')->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->string('gateway_reference')->nullable();
            $table->string('status')->default('pending');
            // Raw gateway callback payload, kept for dispute investigation. Never log secrets here.
            $table->json('gateway_response')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_attempts');
        Schema::dropIfExists('payments');
    }
};