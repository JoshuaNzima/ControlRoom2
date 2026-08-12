<?php

namespace App\Models\Guards;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Models\Zone;

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
        return $this->belongsTo(Guard::class, 'guard_id');
    }

    public function clientSite(): BelongsTo
    {
        return $this->belongsTo(ClientSite::class);
    }

    public function site(): BelongsTo
    {
        return $this->clientSite();
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Check if assigning a guard to a given site would cross zone boundaries on overlapping dates.
     * Returns an array of zone names the guard is already assigned to on overlapping dates,
     * or an empty array if no conflict.
     *
     * @return array{ conflicting?: bool, existing_zone?: string, new_zone?: string, message?: string }
     */
    public static function checkZoneConsistency(
        int $guardId,
        int $newSiteId,
        string $startDate,
        ?string $endDate = null,
        ?int $excludeAssignmentId = null
    ): array {
        $newSite = ClientSite::with('zone:id,name')->find($newSiteId);
        if (!$newSite || !$newSite->zone_id) {
            return []; // no zone info to check
        }

        $newZoneId = (int) $newSite->zone_id;
        $newZoneName = $newSite->zone?->name ?? "Zone #{$newZoneId}";

        $end = $endDate ?? '9999-12-31';

        // Find other active assignments for this guard whose date range overlaps
        $otherAssignments = static::where('guard_id', $guardId)
            ->where('client_site_id', '!=', $newSiteId) // exclude assignments at the same site
            ->when($excludeAssignmentId, fn ($q, $id) => $q->where('id', '!=', $id))
            ->where('is_active', true)
            ->where('start_date', '<=', $end)
            ->where(function ($q) use ($startDate) {
                $q->whereNull('end_date')
                  ->orWhere('end_date', '>=', $startDate);
            })
            ->with('clientSite.zone:id,name')
            ->get();

        foreach ($otherAssignments as $assignment) {
            $otherSite = $assignment->clientSite;
            if (!$otherSite || !$otherSite->zone_id) {
                continue;
            }
            $otherZoneId = (int) $otherSite->zone_id;

            if ($otherZoneId !== $newZoneId) {
                $otherZoneName = $otherSite->zone?->name ?? "Zone #{$otherZoneId}";
                return [
                    'conflicting' => true,
                    'existing_zone' => $otherZoneName,
                    'new_zone' => $newZoneName,
                    'message' => "Guard is assigned to '{$otherSite->name}' in zone '{$otherZoneName}', but the new site '{$newSite->name}' is in zone '{$newZoneName}'. This may create zone conflicts on overlapping dates.",
                ];
            }
        }

        return [];
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
