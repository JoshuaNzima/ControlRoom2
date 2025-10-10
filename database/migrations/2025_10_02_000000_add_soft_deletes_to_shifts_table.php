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
        if (Schema::hasTable('shifts') && !Schema::hasColumn('shifts', 'deleted_at')) {
            Schema::table('shifts', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (Schema::hasTable('shifts') && Schema::hasColumn('shifts', 'deleted_at')) {
            Schema::table('shifts', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
