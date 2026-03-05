<?php

namespace App\Models\FrontOffice;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class OfficeDuty extends Model
{
    use HasFactory, SoftDeletes;

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
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The user (assistant) who owns this duty
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The user who assigned this duty
     */
    public function assigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    /**
     * The recipient user (if internal)
     */
    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }

    /**
     * Linked Finance expense record
     */
    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }

    /**
     * Scope: Get duties by type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('duty_type', $type);
    }

    /**
     * Scope: Get duties by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Get pending duties
     */
    public function scopePending($query)
    {
        return $query->whereIn('status', ['pending', 'in_progress']);
    }

    /**
     * Scope: Get today's duties
     */
    public function scopeToday($query)
    {
        return $query->whereDate('scheduled_start', today());
    }

    /**
     * Scope: Get duties for specific recipient
     */
    public function scopeForRecipient($query, $userId)
    {
        return $query->where('recipient_user_id', $userId);
    }

    /**
     * Scope: Get duties with petty cash
     */
    public function scopeWithPettyCash($query)
    {
        return $query->whereNotNull('petty_cash_amount')->where('petty_cash_amount', '>', 0);
    }

    /**
     * Check if duty has linked expense
     */
    public function hasExpense(): bool
    {
        return !is_null($this->expense_id);
    }

    /**
     * Get duty type label
     */
    public function getDutyTypeLabel(): string
    {
        $labels = [
            'calendar_schedule' => 'Calendar & Schedule Management',
            'communication' => 'Communication Management',
            'meeting_coordination' => 'Meeting Coordination',
            'travel_arrangements' => 'Travel Arrangements',
            'report_document' => 'Report & Document Preparation',
            'petty_cash' => 'Petty Cash Management',
            'confidential' => 'Confidential Information',
            'event_planning' => 'Event Planning',
            'office_admin_support' => 'Office & Administrative Support',
        ];

        return $labels[$this->duty_type] ?? $this->duty_type;
    }

    /**
     * Create Finance expense from petty cash
     */
    public function createExpense(): Expense
    {
        $expense = Expense::create([
            'amount' => $this->petty_cash_amount,
            'category' => 'petty_cash',
            'description' => "Petty Cash: {$this->title}",
            'expense_date' => now(),
            'user_id' => $this->user_id,
            'status' => 'pending',
            'notes' => "Office Duty ID: {$this->id}\nReceipt: {$this->expense_receipt_number}\nNotes: {$this->notes}",
        ]);

        $this->update(['expense_id' => $expense->id]);

        return $expense;
    }
}
