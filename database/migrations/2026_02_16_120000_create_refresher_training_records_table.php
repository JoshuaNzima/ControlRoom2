<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refresher_training_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guard_id')->constrained('guards')->onDelete('cascade');
            $table->foreignId('refresher_id')->constrained('training_refreshers')->onDelete('cascade');
            $table->foreignId('trainer_id')->constrained('users')->onDelete('cascade');
            $table->date('training_date');
            $table->date('completed_date')->nullable();
            $table->enum('status', ['in_progress', 'completed', 'passed', 'failed', 'dismissed', 'promoted'])->default('in_progress');
            $table->text('trainer_notes')->nullable();
            $table->text('dismissal_reason')->nullable();
            $table->timestamp('evaluated_at')->nullable();
            $table->foreignId('evaluated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refresher_training_records');
    }
};
