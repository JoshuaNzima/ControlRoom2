<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Commission extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'total_amount',
        'source',
        'description',
        'status',
        'approved_at',
        'approved_by',
        'paid_at',
        'paid_by',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function splits(): HasMany
    {
        return $this->hasMany(CommissionSplit::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    // Calculate split amounts based on percentages
    public function calculateSplits(): void
    {
        foreach ($this->splits as $split) {
            $split->amount = $this->total_amount * ($split->percentage / 100);
            $split->save();
        }
    }

    // Get total allocated percentage
    public function getTotalAllocatedPercentage(): float
    {
        return $this->splits->sum('percentage');
    }

    // Check if splits are valid (total = 100%)
    public function hasValidSplits(): bool
    {
        return abs($this->getTotalAllocatedPercentage() - 100.0) < 0.01;
    }

    // Get user's share of this commission
    public function getUserShare(int $userId): ?CommissionSplit
    {
        return $this->splits()->where('user_id', $userId)->first();
    }

    // Get all users in this commission
    public function getUsers(): array
    {
        return $this->splits()->with('user')->get()->pluck('user')->toArray();
    }
}
