<?php

namespace App\Models\Guards;

use App\Models\Camera;
use App\Models\CameraAlert;
use App\Models\Shift as ScheduleShift;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class ClientSite extends Model
{
    use SoftDeletes;

    public static function requiredGuardsBySiteFromScheduleShifts(array $siteIds): array
    {
        $siteIds = array_values(array_unique(array_filter(array_map('intval', $siteIds))));
        if (empty($siteIds)) {
            return [];
        }

        $siteIdSet = array_fill_keys($siteIds, true);
        $requiredBySite = array_fill_keys($siteIds, 0);

        $shiftRows = ScheduleShift::query()
            ->select(['required_guards', 'sites', 'status', 'is_global'])
            ->where('is_global', false)
            ->whereNotNull('sites')
            ->whereIn('status', ['active', 'scheduled'])
            ->get();

        foreach ($shiftRows as $shift) {
            $reqTotal = (int) ($shift->required_guards ?? 0);
            if ($reqTotal <= 0) {
                continue;
            }

            $shiftSites = is_array($shift->sites) ? $shift->sites : [];
            $inScope = [];
            foreach ($shiftSites as $sid) {
                $sid = (int) $sid;
                if (isset($siteIdSet[$sid])) {
                    $inScope[$sid] = true;
                }
            }

            $scopeSiteIds = array_keys($inScope);
            $scopeCount = count($scopeSiteIds);
            if ($scopeCount <= 0) {
                continue;
            }

            sort($scopeSiteIds);
            $base = intdiv($reqTotal, $scopeCount);
            $rem = $reqTotal % $scopeCount;
            foreach ($scopeSiteIds as $i => $sid) {
                $add = $base + ($i < $rem ? 1 : 0);
                $requiredBySite[$sid] = (int) ($requiredBySite[$sid] ?? 0) + $add;
            }
        }

        return $requiredBySite;
    }

    public static function recalcZoneRequiredGuards($zoneId): void
    {
        self::updateZoneRequiredGuards($zoneId);
    }

    protected $fillable = [
        'client_id',
        'name',
        'address',
        'contact_person',
        'phone',
        'latitude',
        'longitude',
        'special_instructions',
        'required_guards',
        'services_requested',
        'status',
        'site_type',
        'zone_id',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'required_guards' => 'integer',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }

    /**
     * Guards assigned to this site through GuardAssignment (many-to-many via assignments)
     */
    public function guards(): BelongsToMany
    {
        return $this->belongsToMany(Guard::class, 'guard_assignments', 'client_site_id', 'guard_id');
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function cameras(): HasMany
    {
        return $this->hasMany(Camera::class, 'client_site_id');
    }

    public function cameraAlerts(): HasManyThrough
    {
        return $this->hasManyThrough(
            CameraAlert::class,
            Camera::class,
            'client_site_id', // Foreign key on cameras table
            'camera_id'       // Foreign key on camera_alerts table
        );
    }

    protected static function booted(): void
    {
        static::created(function (self $site) {
            self::updateZoneRequiredGuards($site->zone_id);
        });

        static::updated(function (self $site) {
            $originalZone = $site->getOriginal('zone_id');
            if ($originalZone && (int)$originalZone !== (int)$site->zone_id) {
                self::updateZoneRequiredGuards($originalZone);
            }
            if ($site->isDirty('zone_id') || $site->isDirty('required_guards') || $site->isDirty('status')) {
                self::updateZoneRequiredGuards($site->zone_id);
            }
        });

        static::deleted(function (self $site) {
            self::updateZoneRequiredGuards($site->zone_id);
        });

        static::restored(function (self $site) {
            self::updateZoneRequiredGuards($site->zone_id);
        });
    }

    protected static function updateZoneRequiredGuards($zoneId): void
    {
        if (!$zoneId) return;
        try {
            $sites = static::query()
                ->where('zone_id', $zoneId)
                ->where('status', 'active')
                ->get(['id', 'required_guards']);

            $siteIds = $sites->pluck('id')->filter()->map(fn ($v) => (int) $v)->values()->all();
            $requiredBySite = self::requiredGuardsBySiteFromScheduleShifts($siteIds);

            $sum = 0;
            foreach ($sites as $site) {
                $siteReq = (int) ($requiredBySite[$site->id] ?? 0);
                if ($siteReq <= 0) {
                    $siteReq = (int) ($site->required_guards ?? 0);
                }
                $sum += $siteReq;
            }

            Zone::whereKey($zoneId)->update(['required_guard_count' => (int) $sum]);
        } catch (\Throwable $e) {}
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function getCurrentGuardsCount(): int
    {
        return $this->attendance()
            ->whereDate('date', today())
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time')
            ->count();
    }
}