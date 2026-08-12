<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('client_payments', function (Blueprint $table) {
            $table->index(['year', 'month']);
            $table->index(['client_id', 'year']);
            $table->index(['paid']);
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->index(['name']);
        });
    }

    public function down()
    {
        Schema::table('client_payments', function (Blueprint $table) {
            $table->dropIndex(['year', 'month']);
            $table->dropIndex(['client_id', 'year']);
            $table->dropIndex(['paid']);
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex(['name']);
        });
    }
};