<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('shifts') && ! Schema::hasColumn('shifts', 'is_global')) {
            Schema::table('shifts', function (Blueprint $table) {
                $after = Schema::hasColumn('shifts', 'sites') ? 'sites' : 'created_by';
                $table->boolean('is_global')->default(false)->after($after);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('shifts') && Schema::hasColumn('shifts', 'is_global')) {
            Schema::table('shifts', function (Blueprint $table) {
                $table->dropColumn('is_global');
            });
        }
    }
};
