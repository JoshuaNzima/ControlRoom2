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

    /**
     * Verify if the given location is within the checkpoint's allowed radius.
     *
     * @param float $latitude User's latitude
     * @param float $longitude User's longitude
     * @param float|null $accuracy GPS accuracy in meters (optional)
     * @return array{verified: bool, distance: float, effective_radius: int, accuracy_used: float|null}
     */
    public function verifyLocation($latitude, $longitude, $accuracy = null): array
    {
        if (!$this->latitude || !$this->longitude) {
            return [
                'verified' => true, // No GPS check if checkpoint has no coordinates
                'distance' => 0,
                'effective_radius' => 0,
                'accuracy_used' => null,
            ];
        }

        $distance = $this->calculateDistance(
            $this->latitude,
            $this->longitude,
            $latitude,
            $longitude
        );

        $radiusMeters = (int) ($this->scan_radius_meters ?: 0);
        if ($radiusMeters <= 0) {
            $radiusMeters = (int) config('scanner.checkpoint_radius_meters', 100);
        }

        // Add GPS accuracy buffer if enabled and accuracy provided
        $effectiveRadius = $radiusMeters;
        $accuracyUsed = null;

        if ($accuracy !== null && config('scanner.gps_accuracy_buffer_enabled', true)) {
            $maxAccuracy = (float) config('scanner.gps_accuracy_max_meters', 100);
            $multiplier = (float) config('scanner.gps_accuracy_min_multiplier', 1.0);

            // Cap accuracy at max allowed
            $cappedAccuracy = min($accuracy, $maxAccuracy);
            $accuracyUsed = $cappedAccuracy;

            // Add accuracy buffer to radius
            $effectiveRadius = $radiusMeters + ($cappedAccuracy * $multiplier);
        }

        return [
            'verified' => $distance <= $effectiveRadius,
            'distance' => $distance,
            'effective_radius' => (int) round($effectiveRadius),
            'accuracy_used' => $accuracyUsed,
        ];
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