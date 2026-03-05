<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IncentiveRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'incentive_type_id',
        'name',
        'description',
        'condition_type',
        'condition_config',
        'calculation_type',
        'calculation_config',
        'min_amount',
        'max_amount',
        'period_type',
        'is_active',
        'effective_from',
        'effective_until',
    ];

    protected $casts = [
        'condition_config' => 'json',
        'calculation_config' => 'json',
        'min_amount' => 'decimal:2',
        'max_amount' => 'decimal:2',
        'is_active' => 'boolean',
        'effective_from' => 'date',
        'effective_until' => 'date',
    ];

    public function incentiveType(): BelongsTo
    {
        return $this->belongsTo(IncentiveType::class);
    }

    public function records(): HasMany
    {
        return $this->hasMany(IncentiveRecord::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('effective_from')
                  ->orWhere('effective_from', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('effective_until')
                  ->orWhere('effective_until', '>=', now());
            });
    }

    public function isValidForPeriod($date): bool
    {
        if ($this->effective_from && $date < $this->effective_from) {
            return false;
        }
        if ($this->effective_until && $date > $this->effective_until) {
            return false;
        }
        return true;
    }
}
