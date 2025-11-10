<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('flags', function (Blueprint $table) {
            if (! Schema::hasColumn('flags', 'title')) {
                $table->string('title')->nullable()->after('details');
            }
            if (! Schema::hasColumn('flags', 'severity')) {
                $table->string('severity')->nullable()->after('title');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('flags', function (Blueprint $table) {
            if (Schema::hasColumn('flags', 'severity')) {
                $table->dropColumn('severity');
            }
            if (Schema::hasColumn('flags', 'title')) {
                $table->dropColumn('title');
            }
        });
    }
};
