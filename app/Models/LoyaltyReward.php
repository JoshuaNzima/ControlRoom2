<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoyaltyReward extends Model
{
    protected $fillable = [
        'name',
        'description',
        'type',
        'points_required',
        'value',
        'unit',
        'quantity_available',
        'quantity_redeemed',
        'is_limited',
        'valid_from',
        'valid_until',
        'terms',
        'requires_approval',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'points_required' => 'decimal:2',
        'value' => 'decimal:2',
        'is_limited' => 'boolean',
        'requires_approval' => 'boolean',
        'is_active' => 'boolean',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'terms' => 'json',
    ];

    public function redemptions(): HasMany
    {
        return $this->hasMany(ClientLoyaltyRedemption::class, 'loyalty_reward_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('valid_from')->orWhere('valid_from', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('valid_until')->orWhere('valid_until', '>=', now());
            });
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order', 'asc')->orderBy('points_required', 'asc');
    }

    /**
     * Check if reward is available for client
     */
    public function isAvailable(): bool
    {
        // Check if limited and sold out
        if ($this->is_limited && $this->quantity_available !== null && $this->quantity_redeemed >= $this->quantity_available) {
            return false;
        }

        // Check validity period
        if ($this->valid_from && $this->valid_from > now()) {
            return false;
        }

        if ($this->valid_until && $this->valid_until < now()) {
            return false;
        }

        return true;
    }

    /**
     * Get remaining quantity
     */
    public function getRemainingQuantity(): ?int
    {
        if (!$this->is_limited || $this->quantity_available === null) {
            return null;
        }

        return max(0, $this->quantity_available - $this->quantity_redeemed);
    }
}
