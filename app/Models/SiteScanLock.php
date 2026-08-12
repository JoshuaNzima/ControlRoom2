<?php

namespace App\Models;

use App\Models\Guards\Checkpoint;
use App\Models\Guards\CheckpointScan;
use App\Models\Guards\ClientSite;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteScanLock extends Model
{
    protected $fillable = [
        'user_id',
        'client_site_id',
        'checkpoint_id',
        'scan_id',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function clientSite(): BelongsTo
    {
        return $this->belongsTo(ClientSite::class);
    }

    public function checkpoint(): BelongsTo
    {
        return $this->belongsTo(Checkpoint::class);
    }

    public function scan(): BelongsTo
    {
        return $this->belongsTo(CheckpointScan::class, 'scan_id');
    }

    /**
     * Get the lock as a scan-data array (same shape as the old session array).
     */
    public function toScanData(): array
    {
        return [
            'scan_id' => $this->scan_id,
            'site_id' => $this->client_site_id,
            'site_name' => $this->clientSite?->name ?? 'Unknown',
            'client_name' => $this->clientSite?->client?->name ?? 'Unknown',
            'checkpoint_id' => $this->checkpoint_id,
            'scanned_at' => $this->created_at?->toIso8601String(),
            'expires_at' => $this->expires_at->toIso8601String(),
        ];
    }

    /**
     * Scope: only active (non-expired) locks.
     */
    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', now());
    }
}
