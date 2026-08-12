<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cameras', function (Blueprint $table) {
            if (!Schema::hasColumn('cameras', 'client_site_id')) {
                $table->foreignId('client_site_id')->nullable()->constrained('client_sites')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('cameras', function (Blueprint $table) {
            if (Schema::hasColumn('cameras', 'client_site_id')) {
                $table->dropForeign(['client_site_id']);
                $table->dropColumn('client_site_id');
            }
        });
    }
};