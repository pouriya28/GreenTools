<?php
// database/migrations/2026_09_13_090000_add_timestamps_to_shipments_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // BUGFIX: Shipment model has cast these as 'datetime' since its
        // creation, but the original migration never created the columns —
        // ->shipped_at / ->delivered_at were silently always null.
        Schema::table('shipments', function (Blueprint $table) {
            $table->timestamp('shipped_at')->nullable()->after('tracking_code');
            $table->timestamp('delivered_at')->nullable()->after('shipped_at');
        });
    }

    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->dropColumn(['shipped_at', 'delivered_at']);
        });
    }
};