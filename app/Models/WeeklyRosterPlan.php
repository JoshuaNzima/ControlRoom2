<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WeeklyRosterPlan extends Model
{
    protected $fillable = [
        'week_start',
        'supervisor_id',
        'created_by',
        'published_by',
        'published_at',
        'status',
        'shift_type',
    ];

    protected $casts = [
        'week_start' => 'date',
        'published_at' => 'datetime',
    ];

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function publishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(WeeklyRosterPlanEntry::class);
    }
}
