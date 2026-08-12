<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PersonalDuty extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'personal_duties';

    protected $fillable = [
        'user_id',
        'assigned_by',
        'duty_type',
        'title',
        'description',
        'priority',
        'status',
        'scheduled_start',
        'scheduled_end',
        'completed_at',
        'employer_name',
        'employer_email',
        'employer_phone',
        'employer_user_id',
        'privacy_level',
        'location_type',
        'budget_amount',
        'actual_amount',
        'expense_id',
        'receipt_reference',
        'vendor_name',
        'pickup_location',
        'dropoff_location',
        'transport_mode',
        'service_provider',
        'household_category',
        'reminder_time',
        'reminder_frequency',
        'correspondence_type',
        'response_draft',
        'awaiting_approval',
        'notes',
        'attachments',
    ];

    protected $casts = [
        'scheduled_start' => 'datetime',
        'scheduled_end' => 'datetime',
        'completed_at' => 'datetime',
        'reminder_time' => 'datetime',
        'budget_amount' => 'decimal:2',
        'actual_amount' => 'decimal:2',
        'awaiting_approval' => 'boolean',
        'attachments' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function employerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_user_id');
    }

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class, 'expense_id');
    }

    public function getDutyTypeLabelAttribute(): string
    {
        return match ($this->duty_type) {
            'diary_management' => 'Diary Management',
            'calls_messages' => 'Handling Calls and Messages',
            'travel_transport' => 'Travel and Transport Arrangements',
            'personal_errands' => 'Personal Errands',
            'document_organization' => 'Document Organization',
            'household_coordination' => 'Household or Personal Task Coordination',
            'correspondence' => 'Correspondence Management',
            'reminders_followups' => 'Reminders and Follow-ups',
            'general_admin_support' => 'General Administrative Support',
            default => 'Other',
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            'completed' => 'text-green-400 bg-green-500/10 border-green-500/20',
            'in_progress' => 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            'cancelled' => 'text-gray-400 bg-gray-500/10 border-gray-500/20',
            default => 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        };
    }

    public function getPriorityColorAttribute(): string
    {
        return match ($this->priority) {
            'urgent' => 'text-red-400 bg-red-500/10 border-red-500/20',
            'high' => 'text-orange-400 bg-orange-500/10 border-orange-500/20',
            'medium' => 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
            default => 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        };
    }

    public function getPrivacyLabelAttribute(): string
    {
        return match ($this->privacy_level) {
            'confidential' => 'Confidential',
            'private' => 'Private',
            default => 'Normal',
        };
    }
}
