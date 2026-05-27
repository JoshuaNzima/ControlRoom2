<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoyaltyTier extends Model
{
    protected $fillable = [
        'name',
        'level',
        'min_points',
        'max_points',
        'multiplier',
        'benefits',
        'color',
        'icon',
        'is_active',
    ];

    protected $casts = [
        'min_points' => 'decimal:2',
        'max_points' => 'decimal:2',
        'multiplier' => 'decimal:2',
        'benefits' => 'json',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('level', 'asc');
    }
}
