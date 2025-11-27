<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            if (!Schema::hasColumn('guards', 'guard_grade_id')) {
                $table->unsignedBigInteger('guard_grade_id')->nullable()->after('guard_type');
                $table->foreign('guard_grade_id')->references('id')->on('guard_grades')->nullOnDelete();
                $table->index('guard_grade_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            if (Schema::hasColumn('guards', 'guard_grade_id')) {
                $table->dropForeign(['guard_grade_id']);
                $table->dropColumn('guard_grade_id');
            }
        });
    }
};
