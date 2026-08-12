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
        if (!Schema::hasTable('guards')) {
            return;
        }

        Schema::table('guards', function (Blueprint $table) {
            $table->boolean('is_leader')->default(false)->after('position');
        });

        // Populate is_leader based on position for existing records
        DB::table('guards')->whereIn('position', ['supervisor', 'sergeant'])->update(['is_leader' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            $table->dropColumn('is_leader');
        });
    }
};
