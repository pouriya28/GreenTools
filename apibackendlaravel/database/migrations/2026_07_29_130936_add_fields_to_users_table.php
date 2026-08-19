<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->unique()->after('email');
            $table->timestamp('phone_verified_at')->nullable()->after('phone');
            $table->enum('user_type', ['customer', 'staff'])->default('customer')->after('phone_verified_at');
            $table->boolean('is_active')->default(true)->after('user_type');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            $table->string('two_factor_secret')->nullable()->after('last_login_at');
            $table->boolean('two_factor_enabled')->default(false)->after('two_factor_secret');

            // مشتری با OTP وارد میشه، پس password باید nullable باشه
            $table->string('password')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone', 'phone_verified_at', 'user_type',
                'is_active', 'last_login_at',
                'two_factor_secret', 'two_factor_enabled',
            ]);
        });
    }
};