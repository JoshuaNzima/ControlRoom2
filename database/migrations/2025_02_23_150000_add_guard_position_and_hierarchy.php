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
            // Add position column: guard, supervisor, sergeant
            $table->enum('position', ['guard', 'supervisor', 'sergeant'])->default('guard')->after('status');
            
            // Add self-referencing hierarchy - guards report to other guards (supervisors/sergeants)
            $table->foreignId('reports_to_guard_id')->nullable()->constrained('guards')->onDelete('set null')->after('supervisor_id');
            $table->index('reports_to_guard_id');
            
            // Make email nullable since supervisors/sergeants don't need accounts
            $table->string('email')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            $table->dropForeign(['reports_to_guard_id']);
            $table->dropIndex(['reports_to_guard_id']);
            $table->dropColumn('reports_to_guard_id');
            $table->dropColumn('position');
            // Note: making email non-nullable again could fail if nulls exist
        });
    }
};
