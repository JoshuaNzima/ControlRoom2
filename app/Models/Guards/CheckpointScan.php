<?php

namespace App\Models\Guards;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class CheckpointScan extends Model
{
    protected $fillable = [
        'checkpoint_id',
        'supervisor_id',
        'scanned_at',
        'latitude',
        'longitude',
        'device_info',
        'location_verified',
        'notes',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'location_verified' => 'boolean',
    ];

    public function checkpoint(): BelongsTo
    {
        return $this->belongsTo(Checkpoint::class);
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function attendance(): BelongsTo
    {
        return $this->belongsTo(Attendance::class, 'checkpoint_scan_id');
    }
}