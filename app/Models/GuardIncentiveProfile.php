<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Guards\Guard;

class GuardIncentiveProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'guard_id',
        'incentive_type_id',
        'custom_config',
        'is_active',
        'effective_from',
        'effective_until',
    ];

    protected $casts = [
        'custom_config' => 'json',
        'is_active' => 'boolean',
        'effective_from' => 'date',
        'effective_until' => 'date',
    ];

    public function guard(): BelongsTo
    {
        return $this->belongsTo(Guard::class);
    }

    public function incentiveType(): BelongsTo
    {
        return $this->belongsTo(IncentiveType::class);
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
}
