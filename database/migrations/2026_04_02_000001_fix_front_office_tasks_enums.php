<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Update priority enum to include 'urgent'
        Schema::table('front_office_tasks', function (Blueprint $table) {
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium')->change();
        });

        // Update category enum to include 'personal'
        Schema::table('front_office_tasks', function (Blueprint $table) {
            $table->enum('category', ['front_office', 'executive', 'general', 'personal'])->default('general')->change();
        });
    }

    public function down(): void
    {
        Schema::table('front_office_tasks', function (Blueprint $table) {
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium')->change();
        });

        Schema::table('front_office_tasks', function (Blueprint $table) {
            $table->enum('category', ['front_office', 'executive', 'general'])->default('general')->change();
        });
    }
};
