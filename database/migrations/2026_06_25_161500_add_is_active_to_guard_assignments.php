<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // is_active is referenced everywhere in code but was never added as a column.
        // The original `active` column exists. We add `is_active`, copy data, then drop `active`.
        if (!Schema::hasColumn('guard_assignments', 'is_active')) {
            Schema::table('guard_assignments', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('notes');
            });
        }

        // Copy existing active data to is_active
        DB::statement('UPDATE guard_assignments SET is_active = active');

        // MySQL blocks dropping indexes that are referenced by foreign keys.
        // Drop the FK first, then indexes, then recreate both.
        $fkName = 'guard_assignments_guard_id_foreign';
        Schema::table('guard_assignments', function (Blueprint $table) use ($fkName) {
            $table->dropForeign($fkName);
        });

        // Drop old indexes referencing `active` before dropping the column
        Schema::table('guard_assignments', function (Blueprint $table) {
            $table->dropIndex(['guard_id', 'active']);
            $table->dropIndex(['client_site_id', 'active']);
        });

        // Drop the old `active` column
        if (Schema::hasColumn('guard_assignments', 'active')) {
            Schema::table('guard_assignments', function (Blueprint $table) {
                $table->dropColumn('active');
            });
        }

        // Rebuild indexes (now using is_active instead of active)
        Schema::table('guard_assignments', function (Blueprint $table) {
            $table->index(['guard_id', 'is_active']);
            $table->index(['client_site_id', 'is_active']);
        });

        // Recreate the foreign key on guard_id
        Schema::table('guard_assignments', function (Blueprint $table) use ($fkName) {
            $table->foreign('guard_id', $fkName)
                  ->references('id')
                  ->on('guards')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('guard_assignments', function (Blueprint $table) {
            if (!Schema::hasColumn('guard_assignments', 'active')) {
                $table->boolean('active')->default(true)->after('notes');
            }
        });

        DB::statement('UPDATE guard_assignments SET active = is_active');

        Schema::table('guard_assignments', function (Blueprint $table) {
            $table->dropColumn('is_active');
            $table->index(['guard_id', 'active']);
            $table->index(['client_site_id', 'active']);
        });
    }
};
