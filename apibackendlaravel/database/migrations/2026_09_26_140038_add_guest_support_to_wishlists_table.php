<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wishlists', function (Blueprint $table) {
            // Make user_id nullable to support guest wishlists
            $table->foreignUlid('user_id')->nullable()->change();

            // High-entropy guest identifier, delivered via HttpOnly cookie.
            // Never derived from user_id, IP, or any predictable value.
            $table->string('guest_token', 64)->nullable()->unique()->after('user_id');

            // Guest wishlists expire after 10 days; authenticated wishlists never expire.
            $table->timestamp('expires_at')->nullable()->after('updated_at');

            // Either user_id or guest_token must be present (enforced in app layer too).
            $table->index(['guest_token']);
        });

        // Defense-in-depth: exactly one of user_id or guest_token must be set.
        DB::statement("
            ALTER TABLE wishlists ADD CONSTRAINT chk_wishlists_owner
            CHECK (
                (user_id IS NOT NULL AND guest_token IS NULL) OR
                (user_id IS NULL AND guest_token IS NOT NULL)
            )
        ");

        // Drop old unique constraint and replace with owner-aware ones
        // Old: unique(user_id, product_id)
        // New: unique per user OR unique per guest_token
        DB::statement("
            CREATE UNIQUE INDEX wishlists_unique_user_product
            ON wishlists (user_id, product_id)
            WHERE user_id IS NOT NULL
        ");

        DB::statement("
            CREATE UNIQUE INDEX wishlists_unique_guest_product
            ON wishlists (guest_token, product_id)
            WHERE guest_token IS NOT NULL
        ");
    }

    public function down(): void
    {
        Schema::table('wishlists', function (Blueprint $table) {
            $table->dropIndex(['guest_token']);
            $table->dropColumn(['guest_token', 'expires_at']);
            $table->foreignUlid('user_id')->nullable(false)->change();
        });

        DB::statement('ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS chk_wishlists_owner');
        DB::statement('DROP INDEX IF EXISTS wishlists_unique_user_product');
        DB::statement('DROP INDEX IF EXISTS wishlists_unique_guest_product');
    }
};
