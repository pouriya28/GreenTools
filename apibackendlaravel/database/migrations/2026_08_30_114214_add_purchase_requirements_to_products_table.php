<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('purchase_requirement', 40)->default('standard')->after('discount_ends_at');
            $table->string('technical_notice', 500)->nullable()->after('purchase_requirement');
            $table->string('installation_notice', 500)->nullable()->after('technical_notice');
            $table->string('compatibility_notice', 500)->nullable()->after('installation_notice');
            $table->boolean('support_contact_enabled')->default(false)->after('compatibility_notice');
            $table->boolean('purchase_confirmation_required')->default(false)->after('support_contact_enabled');

            $table->index('purchase_requirement');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['purchase_requirement']);
            $table->dropColumn([
                'purchase_requirement',
                'technical_notice',
                'installation_notice',
                'compatibility_notice',
                'support_contact_enabled',
                'purchase_confirmation_required',
            ]);
        });
    }
};