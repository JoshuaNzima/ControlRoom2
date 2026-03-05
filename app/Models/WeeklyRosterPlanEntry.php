<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeeklyRosterPlanEntry extends Model
{
    protected $fillable = [
        'weekly_roster_plan_id',
        'guard_id',
        'date',
        'client_site_id',
        'entry_type',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(WeeklyRosterPlan::class, 'weekly_roster_plan_id');
    }

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Guards\Guard::class, 'guard_id');
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Guards\ClientSite::class, 'client_site_id');
    }
}
