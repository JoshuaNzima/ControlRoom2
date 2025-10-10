<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_sites', function (Blueprint $table) {
            $table->text('services_requested')->nullable()->after('required_guards');
        });
    }

    public function down(): void
    {
        Schema::table('client_sites', function (Blueprint $table) {
            $table->dropColumn('services_requested');
        });
    }
};


