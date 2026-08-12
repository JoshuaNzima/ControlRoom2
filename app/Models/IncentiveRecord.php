<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IncentiveRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'year',
        'month',
        'base_amount',
        'unresolved_down_count',
        'total_penalties',
        'final_amount',
        'status',
        'approved_at',
        'approved_by',
        'paid_at',
        'paid_by',
        'notes',
    ];

    protected $casts = [
        'base_amount' => 'decimal:2',
        'total_penalties' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    public function downPenalties(): HasMany
    {
        return $this->hasMany(IncentiveDownPenalty::class);
    }

    // Calculate final amount
    public function calculateFinalAmount(): void
    {
        $this->final_amount = max(0, $this->base_amount - $this->total_penalties);
    }

    // Get month name
    public function getMonthName(): string
    {
        return date('F', mktime(0, 0, 0, $this->month, 1));
    }

    // Get period label (e.g., "January 2024")
    public function getPeriodLabel(): string
    {
        return $this->getMonthName() . ' ' . $this->year;
    }

    // Scope for specific period
    public function scopeForPeriod($query, int $year, int $month)
    {
        return $query->where('year', $year)->where('month', $month);
    }

    // Scope for user
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Scope by status
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
