<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class OfficeDuty extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'office_duties';

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
        'recipient_name',
        'recipient_email',
        'recipient_phone',
        'recipient_user_id',
        'recipient_type',
        'petty_cash_amount',
        'expense_id',
        'expense_receipt_number',
        'meeting_location',
        'meeting_agenda',
        'meeting_minutes',
        'travel_destination',
        'travel_booking_ref',
        'document_reference',
        'confidentiality_level',
        'notes',
        'attachments',
    ];

    protected $casts = [
        'scheduled_start' => 'datetime',
        'scheduled_end' => 'datetime',
        'completed_at' => 'datetime',
        'petty_cash_amount' => 'decimal:2',
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

    public function recipientUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class, 'expense_id');
    }

    public function getDutyTypeLabelAttribute(): string
    {
        return match ($this->duty_type) {
            'calendar_schedule' => 'Calendar & Schedule Management',
            'communication' => 'Communication Management',
            'meeting_coordination' => 'Meeting Coordination',
            'travel_arrangements' => 'Travel Arrangements',
            'report_document' => 'Report & Document Preparation',
            'petty_cash' => 'Petty Cash Management',
            'confidential' => 'Confidential Information Handling',
            'event_planning' => 'Event Planning',
            'office_admin_support' => 'Office & Administrative Support',
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
}
