<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hr_benefit_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hr_benefit_id')->constrained('hr_benefits')->cascadeOnDelete();
            $table->foreignId('guard_id')->constrained('guards')->cascadeOnDelete();
            $table->string('status', 20)->default('active')->index();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['hr_benefit_id','guard_id','status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_benefit_enrollments');
    }
};
