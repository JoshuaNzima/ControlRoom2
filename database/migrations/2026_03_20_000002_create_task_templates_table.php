<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('module', 50)->nullable();
            $table->string('priority', 10)->default('medium');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('task_template_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_template_id')->constrained('task_templates')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('module', 50)->nullable();
            $table->string('priority', 10)->default('medium');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_template_items');
        Schema::dropIfExists('task_templates');
    }
};