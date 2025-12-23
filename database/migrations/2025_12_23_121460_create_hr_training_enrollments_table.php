<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_training_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hr_training_course_id')->constrained('hr_training_courses')->cascadeOnDelete();
            $table->foreignId('hr_training_session_id')->nullable()->constrained('hr_training_sessions')->nullOnDelete();
            $table->foreignId('guard_id')->constrained('guards')->cascadeOnDelete();
            $table->string('status')->default('enrolled');
            $table->dateTime('completed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_training_enrollments');
    }
};
