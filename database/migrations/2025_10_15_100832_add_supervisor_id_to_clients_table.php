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
        if (!Schema::hasColumn('clients', 'supervisor_id')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete()->after('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('clients', 'supervisor_id')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->dropForeign(['supervisor_id']);
                $table->dropColumn('supervisor_id');
            });
        }
    }
};
