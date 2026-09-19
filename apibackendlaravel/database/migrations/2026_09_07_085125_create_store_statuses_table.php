<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_statuses', function (Blueprint $table) {
            $table->id();
            $table->boolean('is_open')->default(true);
            $table->string('closed_reason')->nullable();
            $table->foreignUlid('closed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });

        // الگوی singleton row: همیشه فقط یک ردیف (id=1) وجود دارد تا هیچ‌وقت دو
        // وضعیت متناقض (مثلاً هم باز و هم بسته) در دیتابیس وجود ندارد.
        DB::table('store_statuses')->insert([
            'is_open' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('store_statuses');
    }
};

