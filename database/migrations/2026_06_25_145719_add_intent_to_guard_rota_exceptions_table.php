<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add enum `intent` column to replace the awkward exception_type-based logic.
     * Valid values: off, work, swap
     *
     * Also backfill from existing exception_type values:
     *   ad_hoc_off, leave, training, swap → off
     *   work_override → work
     */
    public function up(): void
    {
        Schema::table('guard_rota_exceptions', function (Blueprint $table) {
            $table->string('intent', 20)->nullable()->after('exception_type')
                ->comment('Simplified intent: off|work|swap — replaces fighting ad_hoc_off vs work_override');
        });

        // Backfill existing exception_type values into the new intent column
        DB::statement("UPDATE guard_rota_exceptions SET intent = 'off' WHERE exception_type IN ('ad_hoc_off', 'leave', 'training', 'swap')");
        DB::statement("UPDATE guard_rota_exceptions SET intent = 'work' WHERE exception_type = 'work_override'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guard_rota_exceptions', function (Blueprint $table) {
            $table->dropColumn('intent');
        });
    }
};
