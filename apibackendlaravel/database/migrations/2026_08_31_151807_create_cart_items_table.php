<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();

            $table->foreignUlid('cart_id')->constrained('carts')->cascadeOnDelete();
            $table->foreignUlid('product_id')->constrained('products')->cascadeOnDelete();

            $table->unsignedInteger('quantity');

            // Snapshot of product_toman price and computed discount at add-time.
            // Rewritten on every revalidation (add/update/checkout); never client-supplied.
            $table->unsignedBigInteger('price_at_addition');
            $table->unsignedBigInteger('discount_at_addition')->default(0);

            // Snapshot of the purchase_requirement enforced when the item was added,
            // so UI/checkout can detect if the requirement changed since then.
            $table->string('purchase_requirement_at_addition')->nullable();
            $table->boolean('purchase_confirmed')->default(false);

            $table->timestamps();

            $table->unique(['cart_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};