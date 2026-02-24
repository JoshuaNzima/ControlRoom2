<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_refreshers', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('duration_hours');
            $table->integer('validity_months'); // How long the refresher is valid
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('training_refresher_trainee', function (Blueprint $table) {
            $table->id();
            $table->foreignId('refresher_id')->constrained('training_refreshers')->onDelete('cascade');
            $table->foreignId('trainee_id')->constrained('training_trainees')->onDelete('cascade');
            $table->date('completed_at');
            $table->date('expires_at'); // Calculated based on validity_months
            $table->text('notes')->nullable();
            $table->foreignId('trained_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['refresher_id', 'trainee_id']);
            $table->index(['trainee_id', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_refresher_trainee');
        Schema::dropIfExists('training_refreshers');
    }
};
