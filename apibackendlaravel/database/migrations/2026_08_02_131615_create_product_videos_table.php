<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();

            // 'upload' = فایل روی دیسک خودمون | 'youtube' | 'aparat' | 'external'
            $table->enum('source_type', ['upload', 'youtube', 'aparat', 'external'])->default('upload');

            // برای upload: مسیر فایل روی دیسک | برای youtube/aparat/external: URL کامل
            $table->string('disk', 30)->nullable();   // فقط وقتی source_type=upload پر می‌شه
            $table->string('path')->nullable();        // فقط وقتی source_type=upload پر می‌شه
            $table->string('external_url')->nullable(); // فقط وقتی youtube/aparat/external پر می‌شه
            $table->string('external_id', 100)->nullable(); // شناسه‌ی ویدیو (مثلاً video_id یوتیوب) برای embed سریع‌تر

            $table->string('thumbnail_path')->nullable();
            $table->string('title', 200)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_videos');
    }
};