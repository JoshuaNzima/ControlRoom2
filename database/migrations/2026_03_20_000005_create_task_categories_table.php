<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('color')->nullable();
            $table->timestamps();
        });

        Schema::create('task_category_task', function (Blueprint $table) {
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->foreignId('task_category_id')->constrained('task_categories')->onDelete('cascade');
            $table->primary(['task_id', 'task_category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_category_task');
        Schema::dropIfExists('task_categories');
    }
};