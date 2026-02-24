<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            $table->tinyInteger('default_off_day')->nullable()->after('position')->comment('0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat');
        });
    }

    public function down(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            $table->dropColumn('default_off_day');
        });
    }
};
