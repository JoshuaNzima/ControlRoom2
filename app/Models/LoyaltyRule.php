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
     * Calculate points based on amount
     */
    public function calculatePoints($amount): float
    {
        return ($amount / intval(explode(' ', $this->unit_description)[2] ?? 1)) * $this->points_per_unit;
    }
}
