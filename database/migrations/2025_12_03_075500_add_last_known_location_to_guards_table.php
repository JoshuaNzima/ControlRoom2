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
            if (! Schema::hasColumn('guards', 'last_known_location')) {
                // store as JSON: {"lat": -26.2, "lng": 28.0}
                $table->json('last_known_location')->nullable()->after('photo');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            if (Schema::hasColumn('guards', 'last_known_location')) {
                $table->dropColumn('last_known_location');
            }
        });
    }
};
