<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('petty_cash_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('date');
            $table->string('description');
            $table->string('category'); // office_supplies, transport, refreshments, other
            $table->decimal('amount', 12, 2);
            $table->string('receipt_number')->nullable();
            $table->string('vendor')->nullable();
            $table->enum('type', ['expense', 'replenishment'])->default('expense');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['date', 'status']);
            $table->index(['user_id', 'date']);
            $table->index('category');
        });
        
        // Petty Cash Balance tracking
        Schema::create('petty_cash_balances', function (Blueprint $table) {
            $table->id();
            $table->decimal('current_balance', 12, 2)->default(0);
            $table->decimal('total_replenished', 12, 2)->default(0);
            $table->decimal('total_spent', 12, 2)->default(0);
            $table->foreignId('last_replenished_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_replenished_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('petty_cash_balances');
        Schema::dropIfExists('petty_cash_entries');
    }
};
