<?php

namespace App\Models\FrontOffice;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PersonalDuty extends Model
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
     * The employer being assisted
     */
    public function employer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_user_id');
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
     * Scope: Get duties for specific employer
     */
    public function scopeForEmployer($query, $userId)
    {
        return $query->where('employer_user_id', $userId);
    }

    /**
     * Scope: Get duties with expenses
     */
    public function scopeWithExpenses($query)
    {
        return $query->whereNotNull('expense_id');
    }

    /**
     * Scope: Get errands (with budget/actual amounts)
     */
    public function scopeErrands($query)
    {
        return $query->where('duty_type', 'personal_errands');
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
            'diary_management' => 'Diary Management',
            'calls_messages' => 'Calls & Messages',
            'travel_transport' => 'Travel & Transport',
            'personal_errands' => 'Personal Errands',
            'document_organization' => 'Document Organization',
            'household_coordination' => 'Household Coordination',
            'correspondence' => 'Correspondence Management',
            'reminders_followups' => 'Reminders & Follow-ups',
            'general_admin_support' => 'General Administrative Support',
        ];

        return $labels[$this->duty_type] ?? $this->duty_type;
    }

    /**
     * Get variance between budget and actual
     */
    public function getBudgetVariance(): ?float
    {
        if (is_null($this->budget_amount) || is_null($this->actual_amount)) {
            return null;
        }
        return $this->budget_amount - $this->actual_amount;
    }

    /**
     * Create Finance expense from actual spending
     */
    public function createExpense(): ?Expense
    {
        if (empty($this->actual_amount) || $this->actual_amount <= 0) {
            return null;
        }

        $expense = Expense::create([
            'amount' => $this->actual_amount,
            'category' => 'personal_expense',
            'description' => "Personal Errand: {$this->title}",
            'expense_date' => now(),
            'user_id' => $this->user_id,
            'status' => 'pending',
            'notes' => "Personal Duty ID: {$this->id}\nVendor: {$this->vendor_name}\nReceipt: {$this->receipt_reference}\nNotes: {$this->notes}",
        ]);

        $this->update(['expense_id' => $expense->id]);

        return $expense;
    }
}
