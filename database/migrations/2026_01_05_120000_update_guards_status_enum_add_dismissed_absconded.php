<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add new enum values 'dismissed' and 'absconded' to guards.status.
        // Use MySQL-specific ALTER for MySQL; no-op for SQLite and others (column is TEXT with app-level validation).
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE guards MODIFY COLUMN status ENUM('active','inactive','suspended','dismissed','absconded') NOT NULL DEFAULT 'active'");
        }
    }

    public function down(): void
    {
        // Revert to original enum values for MySQL only; no-op for SQLite/others.
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE guards MODIFY COLUMN status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active'");
        }
    }
};
