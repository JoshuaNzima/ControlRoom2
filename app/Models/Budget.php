<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Budget extends Model
{
    protected $fillable = [
        'name',
        'category',
        'budgeted_amount',
        'fiscal_year',
        'fiscal_month',
        'user_id',
        'description',
        'status',
    ];

    protected $casts = [
        'budgeted_amount' => 'decimal:2',
    ];

    /**
     * Get the user who created this budget
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the total spent against this budget
     */
    public function getTotalSpent(): float
    {
        $query = Expense::where('category', $this->category)
            ->approved();

        if ($this->fiscal_month) {
            // Monthly budget
            return $query->whereYear('expense_date', $this->fiscal_year)
                ->whereMonth('expense_date', $this->fiscal_month)
                ->sum('amount');
        } else {
            // Annual budget
            return $query->whereYear('expense_date', $this->fiscal_year)
                ->sum('amount');
        }
    }

    /**
     * Get the remaining budget
     */
    public function getRemainingBudget(): float
    {
        return (float) $this->budgeted_amount - $this->getTotalSpent();
    }

    /**
     * Get the percentage spent (0-100)
     */
    public function getPercentageSpent(): float
    {
        if ($this->budgeted_amount == 0) {
            return 0;
        }
        return min(100, ($this->getTotalSpent() / (float) $this->budgeted_amount) * 100);
    }

    /**
     * Check if budget is exceeded
     */
    public function isExceeded(): bool
    {
        return $this->getTotalSpent() > (float) $this->budgeted_amount;
    }

    /**
     * Check if budget is critically low (over 80%)
     */
    public function isCriticallyLow(): bool
    {
        return $this->getPercentageSpent() >= 80;
    }

    /**
     * Scope to filter budgets by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter active budgets
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to filter budgets by fiscal year
     */
    public function scopeByFiscalYear($query, $year)
    {
        return $query->where('fiscal_year', $year);
    }

    /**
     * Scope to filter annual budgets
     */
    public function scopeAnnual($query)
    {
        return $query->whereNull('fiscal_month');
    }

    /**
     * Scope to filter monthly budgets
     */
    public function scopeMonthly($query)
    {
        return $query->whereNotNull('fiscal_month');
    }
}
