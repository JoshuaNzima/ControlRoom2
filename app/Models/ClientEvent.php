<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Guards\Client as GuardClient;

class ClientEvent extends Model
{
    protected $fillable = [
        'client_id',
        'title',
        'event_date',
        'start_time',
        'end_time',
        'location',
        'category',
        'billing_type',
        'rate',
        'quantity',
        'expected_amount',
        'status',
        'k9_units',
        'notes',
    ];

    protected $casts = [
        'event_date' => 'date',
        'rate' => 'decimal:2',
        'expected_amount' => 'decimal:2',
    ];

    public const CATEGORIES = [
        'k9',
        'event_security',
        'other',
    ];

    public const STATUSES = [
        'planned',
        'confirmed',
        'completed',
        'cancelled',
    ];

    public const BILLING_TYPES = [
        'per_event',
        'per_hour',
        'per_day',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(GuardClient::class, 'client_id');
    }
}
