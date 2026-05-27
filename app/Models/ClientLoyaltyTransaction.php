<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ClientLoyaltyTransaction extends Model
{
    protected $fillable = [
        'client_loyalty_points_id',
        'client_id',
        'type',
        'points',
        'balance_before',
        'balance_after',
        'reason',
        'related_id',
        'related_type',
        'causable_id',
        'causable_type',
        'metadata',
        'status',
    ];

    protected $casts = [
        'points' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'metadata' => 'json',
    ];

    protected $dates = ['created_at', 'updated_at'];

    public function loyaltyPoints(): BelongsTo
    {
        return $this->belongsTo(ClientLoyaltyPoints::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Guards\Client::class);
    }

    public function causable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope for earning transactions
     */
    public function scopeEarned($query)
    {
        return $query->where('type', 'earned');
    }

    /**
     * Scope for redemption transactions
     */
    public function scopeRedeemed($query)
    {
        return $query->where('type', 'redeemed');
    }

    /**
     * Scope for completed transactions
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Get display label for transaction type
     */
    public function getTypeLabel(): string
    {
        return match($this->type) {
            'earned' => '+ Points Earned',
            'redeemed' => '- Points Redeemed',
            'expired' => '- Points Expired',
            'adjusted' => 'Points Adjusted',
            'bonus' => '+ Bonus Points',
            default => ucfirst($this->type),
        };
    }

    /**
     * Get color for transaction type
     */
    public function getTypeColor(): string
    {
        return match($this->type) {
            'earned', 'bonus' => 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
            'redeemed' => 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
            'expired' => 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
            'adjusted' => 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
            default => 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
        };
    }
}
