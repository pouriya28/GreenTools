<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // High-entropy guest identifier, delivered via a dedicated HttpOnly cookie.
            // Never derived from user_id, IP, or any predictable value.
            $table->string('guest_token', 64)->nullable()->unique();

            $table->enum('status', ['active', 'converted', 'abandoned', 'expired'])
                ->default('active');

            $table->unsignedBigInteger('version')->default(1);

            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['guest_token', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};