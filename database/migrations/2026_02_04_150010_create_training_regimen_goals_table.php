<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_regimen_goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('regimen_id')->constrained('training_regimens')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('max_score')->default(10);
            $table->unsignedInteger('weight')->default(1);
            $table->unsignedInteger('sort_order')->default(1);
            $table->timestamps();

            $table->index(['regimen_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_regimen_goals');
    }
};
