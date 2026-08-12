<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_trainees', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('id_number')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();

            $table->text('notes')->nullable();

            $table->enum('training_track', ['standard', 'rapid_response'])->default('standard');
            $table->unsignedInteger('training_days')->default(10);
            $table->date('training_start_date')->nullable();
            $table->date('training_end_date')->nullable();

            $table->enum('status', [
                'pending_assignment',
                'in_training',
                'pending_review',
                'approved',
                'rejected',
            ])->default('pending_assignment');

            $table->foreignId('regimen_id')->nullable()->constrained('training_regimens')->nullOnDelete();

            $table->foreignId('primary_trainer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('decided_at')->nullable();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('decision_notes')->nullable();

            $table->foreignId('converted_guard_id')->nullable()->constrained('guards')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'training_track']);
            $table->index(['primary_trainer_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_trainees');
    }
};
