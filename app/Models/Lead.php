<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lead extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'source',
        'status',
        'score',
        'assigned_to',
        'campaign_id',
        'notes',
    ];

    protected $casts = [
        'score' => 'integer',
    ];

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'assigned_to');
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(\App\Models\MarketingCampaign::class, 'campaign_id');
    }
}
