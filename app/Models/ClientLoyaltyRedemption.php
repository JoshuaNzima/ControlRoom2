<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientLoyaltyRedemption extends Model
{
    protected $fillable = [
        'client_id',
        'loyalty_reward_id',
        'client_loyalty_transaction_id',
        'points_used',
        'value_received',
        'status',
        'rejection_reason',
        'approved_at',
        'approved_by',
        'redeemed_at',
        'metadata',
    ];

    protected $casts = [
        'points_used' => 'decimal:2',
        'value_received' => 'decimal:2',
        'approved_at' => 'datetime',
        'redeemed_at' => 'datetime',
        'metadata' => 'json',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Guards\Client::class);
    }

    public function reward(): BelongsTo
    {
        return $this->belongsTo(LoyaltyReward::class, 'loyalty_reward_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(ClientLoyaltyTransaction::class, 'client_loyalty_transaction_id');
    }

    public function approvedBy(): BelongsTo
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

    public function getStatusLabel(): string
    {
        return match($this->status) {
            'pending' => 'Pending Approval',
            'approved' => 'Approved',
            'completed' => 'Completed',
            'rejected' => 'Rejected',
            'cancelled' => 'Cancelled',
            default => ucfirst($this->status),
        };
    }

    public function getStatusColor(): string
    {
        return match($this->status) {
            'pending' => 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
            'approved' => 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
            'completed' => 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
            'rejected' => 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
            'cancelled' => 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
            default => 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
        };
    }
}
