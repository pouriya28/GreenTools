<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // نام کاربری مجزا برای پرسنل (ادمین/مدیر). برای مشتری همیشه null می‌ماند.
            $table->string('username')->nullable()->unique()->after('name');

            // برای قفل خودکار حساب پس از تلاش‌های ناموفق ورود
            $table->unsignedTinyInteger('failed_login_attempts')->default(0)->after('last_login_at');
            $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'failed_login_attempts', 'locked_until']);
        });
    }
};
