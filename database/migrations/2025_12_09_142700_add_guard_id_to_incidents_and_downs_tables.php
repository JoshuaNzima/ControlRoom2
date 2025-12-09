<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            if (!Schema::hasColumn('incidents', 'guard_id')) {
                $table->foreignId('guard_id')->nullable()->after('assigned_to')->constrained('guards')->nullOnDelete();
            }
        });

        Schema::table('downs', function (Blueprint $table) {
            if (!Schema::hasColumn('downs', 'guard_id')) {
                $table->foreignId('guard_id')->nullable()->after('reported_by')->constrained('guards')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            if (Schema::hasColumn('incidents', 'guard_id')) {
                $table->dropConstrainedForeignId('guard_id');
            }
        });

        Schema::table('downs', function (Blueprint $table) {
            if (Schema::hasColumn('downs', 'guard_id')) {
                $table->dropConstrainedForeignId('guard_id');
            }
        });
    }
};
