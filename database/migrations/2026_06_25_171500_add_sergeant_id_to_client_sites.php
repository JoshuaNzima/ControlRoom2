<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_sites', function (Blueprint $table) {
            $table->foreignId('sergeant_id')
                ->nullable()
                ->after('zone_id')
                ->constrained('guards')
                ->nullOnDelete()
                ->comment('The sergeant assigned to this specific site (overrides client-level sergeant)');
        });
    }

    public function down(): void
    {
        Schema::table('client_sites', function (Blueprint $table) {
            $table->dropForeign(['sergeant_id']);
            $table->dropColumn('sergeant_id');
        });
    }
};
