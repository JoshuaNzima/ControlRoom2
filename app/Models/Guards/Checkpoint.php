<?php

namespace App\Models\Guards;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Checkpoint extends Model
{
    protected $fillable = [
        'client_site_id',
        'name',
        'code',
        'type',
        'description',
        'is_active',
        'requires_photo',
        'scan_radius_meters',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'requires_photo' => 'boolean',
        'scan_radius_meters' => 'integer',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($checkpoint) {
            if (!$checkpoint->code) {
                $checkpoint->code = self::generateUniqueCode();
            }
        });
    }

    public static function generateUniqueCode(): string
    {
        do {
            $code = 'CHK-' . strtoupper(Str::random(12));
        } while (self::where('code', $code)->exists());
        
        return $code;
    }

    public function clientSite(): BelongsTo
    {
        return $this->belongsTo(ClientSite::class);
    }

    public function scans(): HasMany
    {
        return $this->hasMany(CheckpointScan::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function verifyLocation($latitude, $longitude): bool
    {
        if (!$this->latitude || !$this->longitude) {
            return true; // No GPS check if checkpoint has no coordinates
        }

        $distance = $this->calculateDistance(
            $this->latitude,
            $this->longitude,
            $latitude,
            $longitude
        );

        return $distance <= $this->scan_radius_meters;
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371000; // meters
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        
        return $earthRadius * $c;
    }

    public function getQrCodeUrl(): string
    {
        return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" . urlencode($this->code);
    }
}