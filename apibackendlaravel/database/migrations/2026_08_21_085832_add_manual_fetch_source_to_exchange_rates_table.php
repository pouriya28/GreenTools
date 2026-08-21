<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // این مایگریشن فقط CHECK constraint ستون source را گسترش می‌دهد تا مقدار
    // جدید 'manual_fetch' (دریافت آنی نرخ از API توسط ادمین با زدن یک دکمه، نه
    // تایپ دستی مقدار) را هم بپذیرد. نام constraint طبق قرارداد پیش‌فرض
    // پستگرس/لاراول "{table}_{column}_check" است.
    //
    // Bug fix مهم: بر خلاف فرض اولیه، ستون source از ابتدا (مایگریشن
    // create_exchange_rates_table) یک varchar(50) آزاد با مقدار پیش‌فرض
    // 'navasan' بوده، نه enum. اگر حتی یک ردیف قدیمی با source='navasan'
    // در جدول باشد، اضافه‌کردن یک CHECK معمولی که این مقدار را نمی‌پذیرد،
    // چون پستگرس ردیف‌های موجود را validate می‌کند، migrate را fail می‌کرد.
    // به همین خاطر (۱) 'navasan' را هم مجاز کرده‌ایم و (۲) constraint را با
    // NOT VALID اضافه می‌کنیم تا ردیف‌های موجود اصلاً چک نشوند (فقط
    // درج/ویرایش‌های بعدی باید مطابقت داشته باشند).
    public function up(): void
    {
        DB::statement('ALTER TABLE exchange_rates DROP CONSTRAINT IF EXISTS exchange_rates_source_check');
        DB::statement(
            "ALTER TABLE exchange_rates ADD CONSTRAINT exchange_rates_source_check ".
            "CHECK (source IN ('scheduled', 'manual_admin', 'manual_fetch', 'navasan')) NOT VALID"
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE exchange_rates DROP CONSTRAINT IF EXISTS exchange_rates_source_check');
    }
};