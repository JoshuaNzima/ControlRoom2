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
        if (!Schema::hasColumn('clients', 'sergeant_id')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->foreignId('sergeant_id')->nullable()->constrained('guards')->nullOnDelete()->after('supervisor_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('clients', 'sergeant_id')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->dropForeign(['sergeant_id']);
                $table->dropColumn('sergeant_id');
            });
        }
    }
};
