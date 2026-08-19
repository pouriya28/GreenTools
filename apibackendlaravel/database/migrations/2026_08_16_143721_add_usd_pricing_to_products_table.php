<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 'price' قبلی تومانی بود؛ الان به‌وضوح price_toman صداش می‌کنیم چون
        // دیگه یه فیلد cache‌شده‌ست، نه ورودی مستقیم ادمین.
        Schema::table('products', function (Blueprint $table) {
            $table->renameColumn('price', 'price_toman');
        });

        Schema::table('products', function (Blueprint $table) {
            // منبع حقیقتِ قیمت؛ فقط همین رو ادمین دستی ست می‌کنه.
            $table->decimal('price_usd', 10, 2)->default(0)->after('price_toman');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE products ADD CONSTRAINT products_price_usd_non_negative CHECK (price_usd >= 0)');
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('price_usd');
            $table->renameColumn('price_toman', 'price');
        });
    }
};