<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personal_duties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('assigned_by')->nullable()->constrained('users')->onDelete('set null');
            
            // Duty categorization
            $table->enum('duty_type', [
                'diary_management',
                'calls_messages',
                'travel_transport',
                'personal_errands',
                'document_organization',
                'household_coordination',
                'correspondence',
                'reminders_followups',
                'general_admin_support',
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
            
            // Employer/Principal info (the person being assisted)
            $table->string('employer_name');
            $table->string('employer_email')->nullable();
            $table->string('employer_phone')->nullable();
            $table->foreignId('employer_user_id')->nullable()->constrained('users')->onDelete('set null');
            
            // Personal details
            $table->enum('privacy_level', ['normal', 'private', 'confidential'])->default('private');
            $table->enum('location_type', ['home', 'office', 'external', 'remote'])->nullable();
            
            // Errand/Shopping specific
            $table->decimal('budget_amount', 12, 2)->nullable();
            $table->decimal('actual_amount', 12, 2)->nullable();
            $table->foreignId('expense_id')->nullable()->constrained()->onDelete('set null');
            $table->string('receipt_reference')->nullable();
            $table->string('vendor_name')->nullable();
            
            // Travel specific
            $table->string('pickup_location')->nullable();
            $table->string('dropoff_location')->nullable();
            $table->string('transport_mode')->nullable(); // car, taxi, flight, etc.
            
            // Household specific
            $table->string('service_provider')->nullable();
            $table->enum('household_category', ['cleaning', 'maintenance', 'catering', 'gardening', 'security', 'other'])->nullable();
            
            // Reminder specific
            $table->dateTime('reminder_time')->nullable();
            $table->enum('reminder_frequency', ['once', 'daily', 'weekly', 'monthly'])->nullable();
            
            // Correspondence
            $table->enum('correspondence_type', ['email', 'letter', 'call', 'message'])->nullable();
            $table->text('response_draft')->nullable();
            $table->boolean('awaiting_approval')->default(false);
            
            // Notes and attachments
            $table->text('notes')->nullable();
            $table->json('attachments')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['user_id', 'duty_type', 'status']);
            $table->index(['user_id', 'scheduled_start']);
            $table->index('employer_user_id');
            $table->index('expense_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_duties');
    }
};
