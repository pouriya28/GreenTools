<?php
// database/migrations/xxxx_xx_xx_add_shipping_snapshot_to_orders_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Same pattern as OrderItem::product_id_snapshot: nullable, non-cascading FK.
            // If the ShippingMethod is later edited or soft-deleted, this order's
            // historical cost/name must not change or break.
            $table->foreignId('shipping_method_id_snapshot')
                ->nullable()
                ->after('cart_id')
                ->constrained('shipping_methods')
                ->nullOnDelete();
            $table->string('shipping_method_name_snapshot')->nullable()->after('shipping_method_id_snapshot');
            $table->string('shipping_calculation_type_snapshot', 32)->nullable()->after('shipping_method_name_snapshot');
            $table->unsignedInteger('shipping_cost')->default(0)->after('shipping_calculation_type_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shipping_method_id_snapshot');
            $table->dropColumn(['shipping_method_name_snapshot', 'shipping_calculation_type_snapshot', 'shipping_cost']);
        });
    }
};
