<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervisor_incentive_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guard_id')->constrained('guards')->comment('Supervisor or Sergeant');
            $table->year('year');
            $table->unsignedTinyInteger('month');
            $table->decimal('base_amount', 12, 2)->default(0)->comment('Monthly base incentive amount');
            $table->decimal('current_balance', 12, 2)->default(0)->comment('Running balance after deductions');
            $table->decimal('total_deductions', 12, 2)->default(0);
            $table->decimal('final_disbursed_amount', 12, 2)->nullable()->comment('Amount paid out at month end');
            $table->enum('status', ['active', 'processing', 'disbursed'])->default('active');
            $table->timestamp('disbursed_at')->nullable();
            $table->foreignId('disbursed_by')->nullable()->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Ensure one balance record per supervisor per month
            $table->unique(['guard_id', 'year', 'month']);
            $table->index(['year', 'month', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supervisor_incentive_balances');
    }
};
