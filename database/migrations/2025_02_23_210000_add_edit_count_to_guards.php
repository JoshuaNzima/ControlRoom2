<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('guards')) {
            return;
        }

        Schema::table('guards', function (Blueprint $table) {
            $table->unsignedInteger('edit_count')->default(0)->after('status');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('guards')) {
            return;
        }

        Schema::table('guards', function (Blueprint $table) {
            $table->dropColumn('edit_count');
        });
    }
};
