<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->ulid('id');
            $table->primary('id');

            // Polymorphic target — the string value here is the morph map
            // ALIAS ('product', 'blog_post'), never the raw FQCN. See
            // AppServiceProvider::boot() for Relation::enforceMorphMap().
            $table->string('commentable_type');
            $table->unsignedBigInteger('commentable_id');

            // Self-referencing reply link. By convention parent_id always
            // points to a ROOT comment (depth is capped at 2 levels); this
            // invariant is enforced in CommentService, not the DB, since a
            // CHECK constraint cannot reference other rows.
            $table->foreignUlid('parent_id')->nullable()->constrained('comments')->cascadeOnDelete();

            // Member author (nullable -> guest comment).
            $table->foreignUlid('user_id')->nullable()->constrained('users')->nullOnDelete();

            // Guest identity fields (required when user_id is null).
            $table->string('guest_name', 100)->nullable();
            $table->string('guest_email', 190)->nullable();

            // SHA-256 hash of the random edit token issued to guests.
            // The raw token is only ever sent once, inside an httpOnly
            // cookie — it is never persisted in plaintext.
            $table->string('edit_token_hash', 64)->nullable();

            $table->text('body');
            $table->unsignedTinyInteger('rating')->nullable(); // 1-5, product-only

            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignUlid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();

            // Kept for abuse investigation / rate-limit auditing, not display.
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['commentable_type', 'commentable_id', 'status']);
            $table->index('parent_id');
            $table->index('user_id');
        });

        // --- Defense-in-depth constraints (Postgres-specific) ---
        // These duplicate rules that are ALSO enforced in the FormRequest/
        // Service layer. If application logic ever has a bug, the database
        // itself still refuses to store invalid data.

        // A comment must belong to either a member or a full guest identity.
        DB::statement("
            ALTER TABLE comments ADD CONSTRAINT chk_comments_identity
            CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_email IS NOT NULL))
        ");

        // Rating range.
        DB::statement("
            ALTER TABLE comments ADD CONSTRAINT chk_comments_rating_range
            CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5))
        ");

        // Rating requires non-empty body text (business rule confirmed earlier).
        DB::statement("
            ALTER TABLE comments ADD CONSTRAINT chk_comments_rating_requires_body
            CHECK (rating IS NULL OR length(trim(body)) > 0)
        ");

        // Rating is only meaningful on products, never on blog posts.
        DB::statement("
            ALTER TABLE comments ADD CONSTRAINT chk_comments_rating_product_only
            CHECK (rating IS NULL OR commentable_type = 'product')
        ");

        // One rating per member per commentable item (partial unique index —
        // NULLs in user_id/guest_email are excluded so this never blocks
        // plain non-rating comments).
        DB::statement("
            CREATE UNIQUE INDEX comments_unique_member_rating
            ON comments (commentable_type, commentable_id, user_id)
            WHERE rating IS NOT NULL AND user_id IS NOT NULL AND deleted_at IS NULL
        ");

        // One rating per guest email per commentable item.
        DB::statement("
            CREATE UNIQUE INDEX comments_unique_guest_rating
            ON comments (commentable_type, commentable_id, guest_email)
            WHERE rating IS NOT NULL AND guest_email IS NOT NULL AND deleted_at IS NULL
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
