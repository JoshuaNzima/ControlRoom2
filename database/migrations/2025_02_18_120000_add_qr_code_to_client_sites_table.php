<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_sites', function (Blueprint $table) {
            $table->string('qr_code', 32)->nullable()->unique()->after('status')->index();
        });
    }

    public function down(): void
    {
        Schema::table('client_sites', function (Blueprint $table) {
            $table->dropIndex(['qr_code']);
            $table->dropColumn('qr_code');
        });
    }
};
