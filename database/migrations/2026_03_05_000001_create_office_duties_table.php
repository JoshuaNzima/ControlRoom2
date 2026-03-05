<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('office_duties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('assigned_by')->nullable()->constrained('users')->onDelete('set null');
            
            // Duty categorization
            $table->enum('duty_type', [
                'calendar_schedule',
                'communication',
                'meeting_coordination',
                'travel_arrangements',
                'report_document',
                'petty_cash',
                'confidential',
                'event_planning',
                'office_admin_support',
            ]);
            
            // Core details
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            
            // Scheduling
            $table->dateTime('scheduled_start')->nullable();
            $table->dateTime('scheduled_end')->nullable();
            $table->dateTime('completed_at')->nullable();
            
            // Recipient/Routing info
            $table->string('recipient_name')->nullable();
            $table->string('recipient_email')->nullable();
            $table->string('recipient_phone')->nullable();
            $table->foreignId('recipient_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('recipient_type', ['executive', 'manager', 'department', 'external', 'other'])->nullable();
            
            // Petty cash / Finance integration
            $table->decimal('petty_cash_amount', 12, 2)->nullable();
            $table->foreignId('expense_id')->nullable()->constrained()->onDelete('set null');
            $table->string('expense_receipt_number')->nullable();
            
            // Meeting specific fields
            $table->string('meeting_location')->nullable();
            $table->text('meeting_agenda')->nullable();
            $table->text('meeting_minutes')->nullable();
            
            // Travel specific fields
            $table->string('travel_destination')->nullable();
            $table->string('travel_booking_ref')->nullable();
            
            // Document/Confidential reference
            $table->string('document_reference')->nullable();
            $table->enum('confidentiality_level', ['normal', 'confidential', 'strictly_confidential'])->nullable();
            
            // Notes and attachments
            $table->text('notes')->nullable();
            $table->json('attachments')->nullable(); // Array of file paths
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['user_id', 'duty_type', 'status']);
            $table->index(['user_id', 'scheduled_start']);
            $table->index('expense_id');
            $table->index('recipient_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('office_duties');
    }
};
