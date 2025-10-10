<?php

namespace App\Models\Guards;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class GuardAssignment extends Model
{
    protected $fillable = [
        'guard_id',
        'client_site_id',
        'assigned_by',
        'start_date',
        'end_date',
        'assignment_type',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function assignedGuard(): BelongsTo
    {
        return $this->belongsTo(Guard::class);
    }

    public function clientSite(): BelongsTo
    {
        return $this->belongsTo(ClientSite::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeCurrent($query)
    {
        return $query->where('start_date', '<=', today())
            ->where(function($q) {
                $q->whereNull('end_date')
                  ->orWhere('end_date', '>=', today());
            });
    }
}