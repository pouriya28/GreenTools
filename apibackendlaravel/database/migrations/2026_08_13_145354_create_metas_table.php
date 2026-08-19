<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metas', function (Blueprint $table) {
            $table->id();
            $table->morphs('metable'); // metable_id, metable_type
            $table->string('meta_title', 180)->nullable();
            $table->string('meta_description', 300)->nullable();
            $table->timestamps();

            // هر رکورد (دسته/محصول/بلاگ) فقط یک متا داره
            $table->unique(['metable_id', 'metable_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metas');
    }
};