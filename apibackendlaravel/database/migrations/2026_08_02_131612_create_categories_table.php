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
            // collation یونیکد بر پایه ICU برای ترتیب صحیح الفبای فارسی در ORDER BY.
            // نیاز به PostgreSQL کامپایل‌شده با ICU داره — روی اکثر توزیع‌های
            // امروزی (apt/Docker official image) پیش‌فرض هست.
            DB::statement("CREATE COLLATION IF NOT EXISTS persian_ci (provider = icu, locale = 'fa', deterministic = true)");
        }

        Schema::create('categories', function (Blueprint $table) use ($isPgsql) {
            $table->id();
            $table->foreignId('parent_id')->nullable()
                ->constrained('categories')->nullOnDelete();

            $name = $table->string('name', 150);
            if ($isPgsql) {
                $name->collation('persian_ci');
            }

            $table->string('slug', 180)->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['parent_id', 'is_active']);
        });

        if ($isPgsql) {
            // یکتایی واقعی «نام زیر یک پدر»:
            // - parent_group: NULL (سطح ریشه) رو به 0 تبدیل می‌کنه، چون Postgres هم
            //   مثل MySQL چند NULL رو در unique index «برابر» نمی‌دونه.
            // - active_name: برای رکوردهای soft-deleted شده NULL می‌شه تا حذف‌شده‌ها
            //   قفل یکتایی رو برای همیشه اشغال نکنن.
            DB::statement('ALTER TABLE categories ADD COLUMN parent_group BIGINT GENERATED ALWAYS AS (COALESCE(parent_id, 0)) STORED');
            DB::statement("ALTER TABLE categories ADD COLUMN active_name VARCHAR(150) COLLATE persian_ci GENERATED ALWAYS AS (CASE WHEN deleted_at IS NULL THEN name ELSE NULL END) STORED");
            DB::statement('CREATE UNIQUE INDEX categories_active_sibling_unique ON categories (parent_group, active_name)');
        }
        // روی درایورهای دیگه (مثلاً sqlite توی تست‌های PHPUnit) این بخش اجرا نمی‌شه؛
        // CategoryService::assertNameNotDuplicateAmongSiblings همون قانون رو مستقل از driver اجرا می‌کنه.
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};