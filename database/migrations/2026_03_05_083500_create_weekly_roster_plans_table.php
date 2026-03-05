<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weekly_roster_plans', function (Blueprint $table) {
            $table->id();
            $table->date('week_start');
            $table->unsignedBigInteger('supervisor_id');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('published_by')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->enum('shift_type', ['day', 'night', 'morning', 'evening', 'custom'])->default('day');
            $table->timestamps();

            $table->foreign('supervisor_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('published_by')->references('id')->on('users')->nullOnDelete();

            $table->unique(['week_start', 'supervisor_id', 'shift_type']);
            $table->index(['supervisor_id', 'week_start']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weekly_roster_plans');
    }
};
