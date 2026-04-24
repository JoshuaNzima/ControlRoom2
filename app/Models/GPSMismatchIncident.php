<?php

namespace App\Models;

use App\Models\Guards\Checkpoint;
use App\Models\Guards\ClientSite;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GPSMismatchIncident extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'site_id',
        'checkpoint_id',
        'scan_type',
        'attempted_latitude',
        'attempted_longitude',
        'expected_latitude',
        'expected_longitude',
        'distance_meters',
        'radius_meters',
        'gps_accuracy',
        'effective_radius_meters',
        'mismatch_count',
        'threshold',
        'window_minutes',
        'escalated',
        'message',
        'occurred_at',
    ];

    protected $casts = [
        'attempted_latitude' => 'decimal:8',
        'attempted_longitude' => 'decimal:8',
        'expected_latitude' => 'decimal:8',
        'expected_longitude' => 'decimal:8',
        'escalated' => 'boolean',
        'occurred_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(ClientSite::class, 'site_id');
    }

    public function checkpoint(): BelongsTo
    {
        return $this->belongsTo(Checkpoint::class);
    }
}
