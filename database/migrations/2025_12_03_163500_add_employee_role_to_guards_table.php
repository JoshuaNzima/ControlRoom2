<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            if (!Schema::hasColumn('guards', 'employee_role')) {
                $table->enum('employee_role', ['guard','driver'])->default('guard')->after('status');
                $table->index('employee_role');
            }
        });
    }

    public function down(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            if (Schema::hasColumn('guards', 'employee_role')) {
                $table->dropIndex(['employee_role']);
                $table->dropColumn('employee_role');
            }
        });
    }
};
