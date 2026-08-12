<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Update category enum to include new departments
        Schema::table('front_office_tasks', function (Blueprint $table) {
            $table->enum('category', [
                'front_office',
                'executive',
                'general',
                'personal',
                'ict',
                'administration',
                'marketing',
                'operations',
                'accounts'
            ])->default('general')->change();
        });
    }

    public function down(): void
    {
        Schema::table('front_office_tasks', function (Blueprint $table) {
            $table->enum('category', ['front_office', 'executive', 'general', 'personal'])->default('general')->change();
        });
    }
};
