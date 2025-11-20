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
        Schema::table('guards', function (Blueprint $table) {
            // Make previously required columns nullable to allow minimal data entry
            $table->string('employee_id')->nullable()->change();
            $table->date('hire_date')->nullable()->change();

            // Add guard_type to classify guards
            if (!Schema::hasColumn('guards', 'guard_type')) {
                $table->enum('guard_type', ['permanent', 'standby', 'reliever'])->nullable()->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            // Revert guard_type
            if (Schema::hasColumn('guards', 'guard_type')) {
                $table->dropColumn('guard_type');
            }
        });
    }
};
