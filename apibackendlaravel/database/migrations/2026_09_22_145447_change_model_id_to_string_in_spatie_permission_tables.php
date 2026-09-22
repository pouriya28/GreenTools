<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->fixModelIdColumn('model_has_permissions', 'permission_id');
        $this->fixModelIdColumn('model_has_roles', 'role_id');
    }

    private function fixModelIdColumn(string $table, string $pivotColumn): void
    {
        // اسم واقعی primary key رو از PostgreSQL بخون (هر بار ممکنه فرق کنه)
        $pk = DB::selectOne("
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = ?
              AND constraint_type = 'PRIMARY KEY'
              AND table_schema = 'public'
        ", [$table]);

        if ($pk) {
            DB::statement("ALTER TABLE {$table} DROP CONSTRAINT \"{$pk->constraint_name}\"");
        }

        // حذف index روی model_id
        DB::statement("DROP INDEX IF EXISTS {$table}_model_id_model_type_index");

        // تغییر نوع ستون از bigint به varchar(26)
        DB::statement("ALTER TABLE {$table} ALTER COLUMN model_id TYPE VARCHAR(26) USING model_id::varchar");

        // بازسازی index
        DB::statement("CREATE INDEX IF NOT EXISTS {$table}_model_id_model_type_index ON {$table} (model_id, model_type)");

        // بازسازی primary key
        DB::statement("ALTER TABLE {$table} ADD PRIMARY KEY ({$pivotColumn}, model_id, model_type)");
    }

    public function down(): void
    {
        $this->revertModelIdColumn('model_has_permissions', 'permission_id');
        $this->revertModelIdColumn('model_has_roles', 'role_id');
    }

    private function revertModelIdColumn(string $table, string $pivotColumn): void
    {
        $pk = DB::selectOne("
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = ?
              AND constraint_type = 'PRIMARY KEY'
              AND table_schema = 'public'
        ", [$table]);

        if ($pk) {
            DB::statement("ALTER TABLE {$table} DROP CONSTRAINT \"{$pk->constraint_name}\"");
        }

        DB::statement("DROP INDEX IF EXISTS {$table}_model_id_model_type_index");
        DB::statement("ALTER TABLE {$table} ALTER COLUMN model_id TYPE BIGINT USING 0");
        DB::statement("CREATE INDEX IF NOT EXISTS {$table}_model_id_model_type_index ON {$table} (model_id, model_type)");
        DB::statement("ALTER TABLE {$table} ADD PRIMARY KEY ({$pivotColumn}, model_id, model_type)");
    }
};