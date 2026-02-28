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
        if (!Schema::hasTable('client_sites')) {
            return;
        }

        if (Schema::hasColumn('client_sites', 'site_type')) {
            return;
        }

        Schema::table('client_sites', function (Blueprint $table) {
            $table->string('site_type')->default('residential')->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('client_sites')) {
            return;
        }

        if (!Schema::hasColumn('client_sites', 'site_type')) {
            return;
        }

        Schema::table('client_sites', function (Blueprint $table) {
            $table->dropColumn('site_type');
        });
    }
};
