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
        Schema::table('gps_mismatch_incidents', function (Blueprint $table) {
            $table->decimal('gps_accuracy', 8, 2)->nullable()->after('radius_meters');
            $table->integer('effective_radius_meters')->nullable()->after('gps_accuracy');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gps_mismatch_incidents', function (Blueprint $table) {
            $table->dropColumn(['gps_accuracy', 'effective_radius_meters']);
        });
    }
};
