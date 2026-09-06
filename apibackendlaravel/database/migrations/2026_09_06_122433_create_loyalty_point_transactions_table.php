<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_point_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 50); // registration, order_completed, review, manual_admin_grant, ...
            $table->integer('points'); // always positive; this ledger is add-only by design
            $table->string('reference_type', 100)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('description', 500)->nullable();

            // Which admin manually granted these points, if any (null for
            // system-triggered grants such as "order completed").
            $table->foreignId('granted_by')->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Deliberately created_at only — see LoyaltyPointTransaction model.
            // This table is a ledger: rows are inserted, never updated or deleted.
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_point_transactions');
    }
};