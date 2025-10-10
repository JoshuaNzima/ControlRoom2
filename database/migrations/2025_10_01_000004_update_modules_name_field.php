<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('modules', function (Blueprint $table) {
            // Make the name field nullable since we use display_name
            $table->string('name')->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->string('name')->nullable(false)->change();
        });
    }
};