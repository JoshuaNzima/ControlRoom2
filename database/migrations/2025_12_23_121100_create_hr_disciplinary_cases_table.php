<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hr_disciplinary_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guard_id')->constrained('guards')->cascadeOnDelete();
            $table->string('case_no')->unique();
            $table->string('type', 100)->index();
            $table->string('status', 40)->default('open')->index();
            $table->string('stage', 60)->nullable();
            $table->text('description')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('outcome_type', 100)->nullable();
            $table->text('outcome')->nullable();
            $table->text('corrective_actions')->nullable();
            $table->timestamp('next_hearing_at')->nullable();
            $table->timestamps();
            $table->index(['guard_id','status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_disciplinary_cases');
    }
};
