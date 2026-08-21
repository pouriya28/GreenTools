<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_price_proposals', function (Blueprint $table) {
            $table->id();
            // Shared batch_id for every proposal generated from one event
            // (weekly rate check or a manual override) - bulk approve/reject
            // operates on this batch_id.
            $table->uuid('batch_id');
            $table->foreignId('exchange_rate_id')->constrained('exchange_rates')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();

            $table->unsignedBigInteger('old_price_toman');
            $table->unsignedBigInteger('new_price_toman'); // system-computed proposed value
            $table->unsignedBigInteger('edited_price_toman')->nullable(); // admin manual edit before approval

            $table->enum('status', ['pending_review', 'approved', 'rejected', 'edited'])->default('pending_review');

            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();

            $table->unique(['batch_id', 'product_id']);
            $table->index(['status', 'batch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_price_proposals');
    }
};