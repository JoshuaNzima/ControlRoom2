<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hr_comp_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guard_id')->constrained('guards')->cascadeOnDelete();
            $table->foreignId('hr_salary_band_id')->nullable()->constrained('hr_salary_bands')->nullOnDelete();
            $table->decimal('amount', 12, 2)->nullable();
            $table->string('currency', 8)->default('USD');
            $table->string('change_type', 40)->default('adjustment'); // adjustment|band_change
            $table->date('effective_date')->nullable();
            $table->string('status', 20)->default('pending')->index(); // pending|approved|declined
            $table->text('reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['guard_id','status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_comp_changes');
    }
};
