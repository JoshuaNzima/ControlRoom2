<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PettyCash extends Model
{
    use HasFactory;

    protected $table = 'petty_cash';

    protected $fillable = [
        'date',
        'description',
        'category',
        'amount',
        'type',
        'receipt_number',
        'receipt_image',
        'approved_by',
        'approved_at',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'approved_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    const CATEGORIES = [
        'office_supplies' => 'Office Supplies',
        'transport' => 'Transport',
        'meals' => 'Meals & Refreshments',
        'communication' => 'Communication',
        'maintenance' => 'Maintenance',
        'cleaning' => 'Cleaning',
        'other' => 'Other',
    ];

    const TYPES = [
        'expense' => 'Expense',
        'replenishment' => 'Replenishment',
    ];

    const STATUSES = [
        'pending' => 'Pending',
        'approved' => 'Approved',
        'rejected' => 'Rejected',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeExpenses($query)
    {
        return $query->where('type', 'expense');
    }

    public function scopeReplenishments($query)
    {
        return $query->where('type', 'replenishment');
    }

    public static function getBalance(): float
    {
        $totalReplenishments = self::where('type', 'replenishment')
            ->where('status', 'approved')
            ->sum('amount');

        $totalExpenses = self::where('type', 'expense')
            ->where('status', 'approved')
            ->sum('amount');

        return $totalReplenishments - $totalExpenses;
    }

    public static function getMonthlyStats(int $year, int $month): array
    {
        $expenses = self::where('type', 'expense')
            ->where('status', 'approved')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');

        $replenishments = self::where('type', 'replenishment')
            ->where('status', 'approved')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');

        $byCategory = self::where('type', 'expense')
            ->where('status', 'approved')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category')
            ->toArray();

        return [
            'expenses' => $expenses,
            'replenishments' => $replenishments,
            'by_category' => $byCategory,
        ];
    }
}
