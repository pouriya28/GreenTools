<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();

            $table->string('name', 200);
            $table->string('slug', 230)->unique();
            $table->string('sku', 64)->unique();

            $table->string('short_description', 500)->nullable();
            $table->longText('description')->nullable();

            $table->unsignedBigInteger('price'); // به‌صورت ریال/کوچک‌ترین واحد پول ذخیره می‌شه، نه float
            $table->enum('discount_type', ['percent', 'fixed'])->nullable();
            $table->unsignedBigInteger('discount_value')->nullable();
            $table->timestamp('discount_starts_at')->nullable();
            $table->timestamp('discount_ends_at')->nullable();

            $table->unsignedInteger('stock_quantity')->default(0);
            $table->enum('stock_status', ['in_stock', 'out_of_stock', 'preorder'])->default('in_stock');

            $table->unsignedInteger('weight_grams')->nullable();

            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->unsignedBigInteger('views_count')->default(0);

            $table->string('meta_title', 180)->nullable();
            $table->string('meta_description', 300)->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['category_id', 'is_active']);
            $table->index(['is_featured', 'is_active']);
            $table->index('stock_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};