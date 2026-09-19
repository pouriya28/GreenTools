<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_attribute_values', function (Blueprint $table) {
            $table->id(); // داخلی، فقط از طریق product لود می‌شه، نیازی به ULID نیست
            $table->foreignUlid('product_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('attribute_id')->constrained()->cascadeOnDelete();
            $table->string('value'); // مقدار به‌صورت متن آزاد، مثلاً "قرمز" یا "500"
            $table->unsignedInteger('sort_order')->default(0); // ترتیب نمایش می‌تونه به ازای هر محصول فرق کنه
            $table->timestamps();

            $table->unique(['product_id', 'attribute_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_attribute_values');
    }
};