<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Guards\Guard;
use App\Models\User;

class SupervisorIncentiveBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'guard_id',
        'year',
        'month',
        'base_amount',
        'current_balance',
        'total_deductions',
        'final_disbursed_amount',
        'status',
        'disbursed_at',
        'disbursed_by',
        'notes',
    ];

    protected $casts = [
        'year' => 'integer',
        'month' => 'integer',
        'base_amount' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'final_disbursed_amount' => 'decimal:2',
        'disbursed_at' => 'datetime',
    ];

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class);
    }

    public function disburser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disbursed_by');
    }

    public function deductions(): HasMany
    {
        return $this->hasMany(SupervisorIncentiveDeduction::class, 'balance_id');
    }

    /**
     * Scope for active balances
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for specific month/year
     */
    public function scopeForPeriod($query, $year, $month)
    {
        return $query->where('year', $year)->where('month', $month);
    }

    /**
     * Scope for guard
     */
    public function scopeForGuard($query, $guardId)
    {
        return $query->where('guard_id', $guardId);
    }

    /**
     * Apply a deduction to this balance
     */
    public function applyDeduction(float $amount, ?int $downId = null, string $reason = '', array $resolutionData = []): SupervisorIncentiveDeduction
    {
        $deduction = $this->deductions()->create([
            'down_id' => $downId,
            'deduction_amount' => $amount,
            'reason' => $reason,
            'resolution_type' => $resolutionData['resolution_type'] ?? null,
            'resolved_by' => $resolutionData['resolved_by'] ?? null,
            'supervisor_id' => $this->guard_id,
            'deducted_at' => now(),
        ]);

        // Update balance
        $this->current_balance = max(0, $this->current_balance - $amount);
        $this->total_deductions += $amount;
        $this->save();

        return $deduction;
    }

    /**
     * Mark balance as disbursed
     */
    public function disburse(int $userId, ?float $amount = null): void
    {
        $this->final_disbursed_amount = $amount ?? $this->current_balance;
        $this->status = 'disbursed';
        $this->disbursed_at = now();
        $this->disbursed_by = $userId;
        $this->save();
    }

    /**
     * Get available balance
     */
    public function getAvailableBalance(): float
    {
        return max(0, $this->current_balance);
    }
}
