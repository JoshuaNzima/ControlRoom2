<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Guards\Guard;
use App\Models\User;

class IncentiveEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'guard_id',
        'incentive_type_id',
        'incentive_rule_id',
        'period_start',
        'period_end',
        'base_amount',
        'calculated_amount',
        'adjustment_amount',
        'adjustment_reason',
        'final_amount',
        'status',
        'calculation_details',
        'notes',
        'calculated_by',
        'calculated_at',
        'approved_by',
        'approved_at',
        'paid_by',
        'paid_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'base_amount' => 'decimal:2',
        'calculated_amount' => 'decimal:2',
        'adjustment_amount' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'calculation_details' => 'json',
        'calculated_at' => 'datetime',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class);
    }

    public function incentiveType(): BelongsTo
    {
        return $this->belongsTo(IncentiveType::class);
    }

    public function incentiveRule(): BelongsTo
    {
        return $this->belongsTo(IncentiveRule::class);
    }

    public function calculator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'calculated_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeForPeriod($query, $start, $end)
    {
        return $query->whereBetween('period_start', [$start, $end])
            ->orWhereBetween('period_end', [$start, $end]);
    }

    public function approve(int $userId): void
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);
    }

    public function markAsPaid(int $userId): void
    {
        $this->update([
            'status' => 'paid',
            'paid_by' => $userId,
            'paid_at' => now(),
        ]);
    }

    public function reject(): void
    {
        $this->update([
            'status' => 'rejected',
        ]);
    }

    public function adjust(float $amount, string $reason): void
    {
        $this->update([
            'adjustment_amount' => $amount,
            'adjustment_reason' => $reason,
            'final_amount' => $this->calculated_amount + $amount,
        ]);
    }
}
