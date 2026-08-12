<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_training_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hr_training_course_id')->constrained('hr_training_courses')->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->string('mode')->default('in_person');
            $table->string('location_or_link')->nullable();
            $table->dateTime('start_at');
            $table->dateTime('end_at')->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->string('trainer_name')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_training_sessions');
    }
};
