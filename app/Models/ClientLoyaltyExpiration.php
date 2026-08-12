<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientLoyaltyExpiration extends Model
{
    protected $fillable = [
        'client_id',
        'points',
        'expires_at',
        'claimed',
        'claimed_at',
        'processing',
        'processing_at',
        'processed',
        'processed_at',
    ];

    protected $casts = [
        'points' => 'decimal:2',
        'expires_at' => 'datetime',
        'claimed_at' => 'datetime',
        'processing_at' => 'datetime',
        'processed_at' => 'datetime',
        'claimed' => 'boolean',
        'processing' => 'boolean',
        'processed' => 'boolean',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Guards\Client::class);
    }

    public function scopePending($query)
    {
        return $query
            ->where('processed', false)
            ->where('claimed', false)
            ->where('processing', false)
            ->where('expires_at', '<=', now());
    }

    public function scopeProcessed($query)
    {
        return $query->where('processed', true);
    }
}
