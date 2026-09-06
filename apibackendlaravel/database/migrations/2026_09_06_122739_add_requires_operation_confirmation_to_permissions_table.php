<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            // Single source of truth for "is this action sensitive enough to
            // require a second, independent password?" — read by
            // EnsureOperationVerified middleware. Avoids scattering
            // if ($permission === 'x' || $permission === 'y') checks in code.
            $table->boolean('requires_operation_confirmation')->default(false)->after('guard_name');
        });
    }

    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropColumn('requires_operation_confirmation');
        });
    }
};