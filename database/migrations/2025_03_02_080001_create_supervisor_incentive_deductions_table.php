<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervisor_incentive_deductions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('balance_id')->constrained('supervisor_incentive_balances')->onDelete('cascade');
            $table->foreignId('down_id')->nullable()->constrained()->comment('Link to the down/issue that caused deduction');
            $table->decimal('deduction_amount', 10, 2);
            $table->text('reason')->comment('Why the deduction was applied');
            
            // Resolution tracking
            $table->enum('resolution_type', ['self_resolved', 'control_room_resolved', 'escalated', 'unresolved'])->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->comment('Who actually resolved the issue');
            $table->foreignId('supervisor_id')->nullable()->constrained('guards')->comment('The supervisor/sergeant responsible');
            
            $table->timestamp('deducted_at');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['balance_id', 'deducted_at']);
            $table->index('down_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supervisor_incentive_deductions');
    }
};
