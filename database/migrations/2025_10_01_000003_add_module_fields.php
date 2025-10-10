<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('modules', function (Blueprint $table) {
            if (!Schema::hasColumn('modules', 'category')) {
                $table->string('category')->after('description')->default('system');
            }
            if (!Schema::hasColumn('modules', 'icon')) {
                $table->string('icon')->after('category')->default('HiOutlineChip');
            }
            if (!Schema::hasColumn('modules', 'route')) {
                $table->string('route')->after('icon')->nullable();
            }
            if (!Schema::hasColumn('modules', 'order')) {
                $table->integer('order')->after('route')->default(0);
            }
            if (!Schema::hasColumn('modules', 'settings')) {
                $table->json('settings')->after('order')->nullable();
            }
        });
    }

    public function down()
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->dropColumn(['category', 'icon', 'route', 'order', 'settings']);
        });
    }
};