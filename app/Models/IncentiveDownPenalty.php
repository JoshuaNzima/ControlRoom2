<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncentiveDownPenalty extends Model
{
    use HasFactory;

    protected $fillable = [
        'incentive_record_id',
        'down_id',
        'penalty_amount',
        'resolution_type',
        'resolved_by',
        'resolved_at',
        'counts_against_incentive',
        'notes',
    ];

    protected $casts = [
        'penalty_amount' => 'decimal:2',
        'resolved_at' => 'datetime',
        'counts_against_incentive' => 'boolean',
    ];

    public function incentiveRecord(): BelongsTo
    {
        return $this->belongsTo(IncentiveRecord::class);
    }

    public function down(): BelongsTo
    {
        return $this->belongsTo(Down::class);
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    // Check if this penalty counts against incentive
    public function shouldCountAgainstIncentive(): bool
    {
        // If resolved by zone commander, it doesn't count
        if ($this->resolution_type === 'zone_commander') {
            return false;
        }
        return $this->counts_against_incentive;
    }
}
