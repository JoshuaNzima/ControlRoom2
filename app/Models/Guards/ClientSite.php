<?php

namespace App\Models\Guards;

use App\Models\Camera;
use App\Models\CameraAlert;
use App\Models\Zone;
use App\Services\ZoneCoverageService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ClientSite extends Model
{
    use SoftDeletes;

    /**
     * Delegate to ZoneCoverageService. Kept as a static convenience for backwards compat.
     */
    public static function recalcZoneRequiredGuards($zoneId): void
    {
        app(ZoneCoverageService::class)->recalculateZone((int) $zoneId);
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
        'sergeant_id',
        'qr_code',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'required_guards' => 'integer',
    ];

    protected $appends = ['site_name'];

    public function getSiteNameAttribute(): string
    {
        return $this->name;
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Zone::class);
    }

    public function sergeant(): BelongsTo
    {
        return $this->belongsTo(Guard::class, 'sergeant_id');
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

    public function checkpoints(): HasMany
    {
        return $this->hasMany(Checkpoint::class, 'client_site_id');
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
        app(ZoneCoverageService::class)->recalculateZone((int) $zoneId);
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

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($site) {
            if (!$site->qr_code) {
                $site->qr_code = self::generateUniqueQrCode();
            }
        });
    }

    public static function generateUniqueQrCode(): string
    {
        do {
            $code = 'SITE-' . strtoupper(Str::random(8));
        } while (self::where('qr_code', $code)->exists());

        return $code;
    }

    public function getQrCodeUrl(): string
    {
        $payload = json_encode([
            'issuer' => 'CoinSecurity',
            'type' => 'site',
            'site_id' => $this->id,
            'code' => $this->qr_code,
            'site_name' => $this->name,
            'client' => optional($this->client)->name,
            'ver' => 'v2'
        ]);
        return 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($payload);
    }

    public function getQrPayload(): array
    {
        return [
            'issuer' => 'CoinSecurity',
            'type' => 'site',
            'site_id' => $this->id,
            'code' => $this->qr_code,
            'site_name' => $this->name,
            'client' => optional($this->client)->name,
            'lat' => $this->latitude !== null ? (float) $this->latitude : null,
            'lng' => $this->longitude !== null ? (float) $this->longitude : null,
            'ver' => 'v2'
        ];
    }
}
