<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_posting_id')->constrained('job_postings')->cascadeOnDelete();
            $table->string('candidate_name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('status')->default('applied'); // applied|screening|interview|offered|hired|rejected
            $table->string('resume_url')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['job_posting_id', 'status']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_applications');
    }
};
