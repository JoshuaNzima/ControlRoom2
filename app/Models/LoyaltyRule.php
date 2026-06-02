<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoyaltyRule extends Model
{
    protected $fillable = [
        'name',
        'type',
        'points_per_unit',
        'unit_description',
        'description',
        'is_active',
        'priority',
        'conditions',
    ];

    protected $casts = [
        'points_per_unit' => 'decimal:2',
        'is_active' => 'boolean',
        'conditions' => 'json',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority', 'desc');
    }

    /**
     * Calculate points based on amount using structured `conditions`.
     *
     * Expected `conditions['unit_amount']` to be a positive number.
     * Returns 0 when unit_amount is missing/invalid.
     */
    public function calculatePoints($amount): float
    {
        $unitAmount = null;

        if (is_array($this->conditions) && isset($this->conditions['unit_amount'])) {
            $unitAmount = (float) $this->conditions['unit_amount'];
        }

        if (!is_numeric($unitAmount) || $unitAmount <= 0) {
            return 0.0;
        }

        return ((float) $amount / $unitAmount) * (float) $this->points_per_unit;
    }
}
