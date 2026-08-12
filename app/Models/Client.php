<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Client extends \App\Models\Guards\Client
{
    // Compatibility wrapper for legacy references to App\Models\Client
    // Explicitly define relationships to ensure they're available in all environments

    protected $fillable = [
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
        'status',
        'billing_start_date',
        'contract_start_date',
        'contract_end_date',
        'monthly_rate',
        'notes',
        'supervisor_id',
        'sergeant_id',
    ];

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function sergeant(): BelongsTo
    {
        return $this->belongsTo(Guards\Guard::class, 'sergeant_id');
    }
}
