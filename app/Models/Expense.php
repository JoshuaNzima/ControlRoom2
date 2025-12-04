<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Expense extends Model
{
    protected $fillable = [
        'amount',
        'category',
        'description',
        'expense_date',
        'user_id',
        'account_id',
        'payment_method',
        'notes',
        'status',
        'approval_stage',
        'admin_approved_by',
        'admin_approved_at',
        'asset_approved_by',
        'asset_approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'admin_approved_at' => 'datetime',
        'asset_approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    /**
     * Get the user who created this expense
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the account associated with this expense
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get attachments for this expense
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(ExpenseAttachment::class);
    }

    /**
     * Scope to filter expenses by category
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope to filter expenses by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter expenses by date range
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('expense_date', [$startDate, $endDate]);
    }

    /**
     * Scope to filter approved expenses
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to filter pending expenses
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
