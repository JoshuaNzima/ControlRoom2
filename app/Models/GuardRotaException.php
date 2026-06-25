<?php

namespace App\Models;

use App\Models\Guards\Guard;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuardRotaException extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'guard_rota_exceptions';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'guard_id',
        'start_date',
        'end_date',
        'exception_type',
        'intent',
        'notes',
        'swap_with_guard_id',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'intent' => 'string',
    ];

    /**
     * The guard this exception applies to.
     */
    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class);
    }

    /**
     * The guard this exception swaps with (for swap/duty-trade exceptions).
     */
    public function swapWithGuard(): BelongsTo
    {
        return $this->belongsTo(Guard::class, 'swap_with_guard_id');
    }

    /**
     * Scope: exceptions matching the given intent.
     */
    public function scopeIntent($query, string $intent)
    {
        return $query->where('intent', $intent);
    }

    /**
     * Scope: exceptions for a specific guard.
     */
    public function scopeForGuard($query, int $guardId)
    {
        return $query->where('guard_id', $guardId);
    }

    /**
     * Scope: exceptions active on a given date (start <= date <= end OR date matches exactly for single-day).
     */
    public function scopeActiveOn($query, string $date)
    {
        return $query->where('start_date', '<=', $date)
            ->where(function ($q) use ($date) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', $date);
            });
    }
}
