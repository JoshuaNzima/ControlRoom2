<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_crash_courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('duration_hours');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('training_crash_course_trainee', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crash_course_id')->constrained('training_crash_courses')->onDelete('cascade');
            $table->foreignId('trainee_id')->constrained('training_trainees')->onDelete('cascade');
            $table->date('enrolled_at');
            $table->date('completed_at')->nullable();
            $table->enum('status', ['enrolled', 'in_progress', 'completed', 'dropped'])->default('enrolled');
            $table->text('notes')->nullable();
            $table->foreignId('trained_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['crash_course_id', 'trainee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_crash_course_trainee');
        Schema::dropIfExists('training_crash_courses');
    }
};
