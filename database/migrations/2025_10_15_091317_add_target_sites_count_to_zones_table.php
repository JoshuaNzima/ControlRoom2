<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('zones', 'target_sites_count')) {
            Schema::table('zones', function (Blueprint $table) {
                $table->unsignedInteger('target_sites_count')->nullable()->after('required_guard_count');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('zones', 'target_sites_count')) {
            Schema::table('zones', function (Blueprint $table) {
                $table->dropColumn('target_sites_count');
            });
        }
    }
};
