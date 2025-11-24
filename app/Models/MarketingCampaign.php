<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketingCampaign extends Model
{
    use HasFactory;

    public const CHANNELS = [
        'social_media',
        'email',
        'sms',
        'billboard',
        'radio',
        'tv',
        'events',
        'other',
    ];

    public const STATUSES = [
        'planned',
        'active',
        'paused',
        'completed',
    ];

    protected $fillable = [
        'name',
        'channel',
        'budget',
        'status',
        'start_date',
        'end_date',
        'objective',
        'target_audience',
        'notes',
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];
}
