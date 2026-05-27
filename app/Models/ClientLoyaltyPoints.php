<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientLoyaltyPoints extends Model
{
    protected $fillable = [
        'client_id',
        'total_points',
        'available_points',
        'redeemed_points',
        'pending_points',
        'last_earned_at',
        'last_redeemed_at',
        'tier_metadata',
    ];

    protected $casts = [
        'total_points' => 'decimal:2',
        'available_points' => 'decimal:2',
        'redeemed_points' => 'decimal:2',
        'pending_points' => 'decimal:2',
        'last_earned_at' => 'datetime',
        'last_redeemed_at' => 'datetime',
        'tier_metadata' => 'json',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Guards\Client::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(ClientLoyaltyTransaction::class);
    }

    public function expirations(): HasMany
    {
        return $this->hasMany(ClientLoyaltyExpiration::class);
    }

    /**
     * Get the current tier based on points
     */
    public function getCurrentTier(): ?LoyaltyTier
    {
        return LoyaltyTier::where('min_points', '<=', $this->available_points)
            ->where(function ($q) {
                $q->whereNull('max_points')
                    ->orWhere('max_points', '>=', $this->available_points);
            })
            ->orderBy('level', 'desc')
            ->first();
    }

    /**
     * Get next tier progression
     */
    public function getNextTier(): ?LoyaltyTier
    {
        $currentTier = $this->getCurrentTier();
        $nextLevel = $currentTier ? $currentTier->level + 1 : 1;

        return LoyaltyTier::where('level', $nextLevel)->first();
    }

    /**
     * Get points needed to reach next tier
     */
    public function getPointsToNextTier(): ?int
    {
        $nextTier = $this->getNextTier();
        if (!$nextTier) return null;

        return max(0, (int)($nextTier->min_points - $this->available_points));
    }
}
