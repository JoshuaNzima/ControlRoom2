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
            $table->boolean('fingerprint_registered')->default(false)->after('notes');
            $table->boolean('uniform_issued')->default(false)->after('fingerprint_registered');
            $table->json('equipment_issued')->nullable()->after('uniform_issued')->comment('List of equipment items issued to guard');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            $table->dropColumn(['fingerprint_registered', 'uniform_issued', 'equipment_issued']);
        });
    }
};
