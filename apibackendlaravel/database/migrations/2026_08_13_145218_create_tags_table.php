<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $isPgsql = DB::getDriverName() === 'pgsql';

        if ($isPgsql) {
            // اگه migration دسته‌بندی‌ها قبلاً اجرا شده و این collation رو ساخته،
            // این خط فقط no-op می‌شه؛ اما این migration رو به ترتیب اجرا وابسته نمی‌کنیم.
            DB::statement("CREATE COLLATION IF NOT EXISTS persian_ci (provider = icu, locale = 'fa', deterministic = true)");
        }

        Schema::create('tags', function (Blueprint $table) use ($isPgsql) {
            $table->id();

            $name = $table->string('name', 100);
            if ($isPgsql) {
                $name->collation('persian_ci');
            }

            $table->string('slug', 120)->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tags');
    }
};