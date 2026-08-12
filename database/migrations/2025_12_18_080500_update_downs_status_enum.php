<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Update enum values for MySQL. SQLite ignores ENUM and treats it as TEXT.
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE `downs` MODIFY `status` ENUM('open','escalated','resolved','closed','absconding') NOT NULL DEFAULT 'open'");
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE `downs` MODIFY `status` ENUM('open','escalated','resolved') NOT NULL DEFAULT 'open'");
        }
    }
};
