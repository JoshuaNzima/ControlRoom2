<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_leaves', function (Blueprint $table) {
            $table->id();
            $table->morphs('employee'); // For users, guards, or any employee type
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('type')->default('off_day'); // off_day, sick_leave, annual_leave, unpaid_leave, etc.
            $table->string('reason')->nullable();
            $table->string('status')->default('approved'); // pending, approved, rejected
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['start_date', 'end_date']);
            $table->index('type');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_leaves');
    }
};
