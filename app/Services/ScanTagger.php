<?php

namespace App\Services;

use App\Models\Guards\CheckpointScan;
use Illuminate\Support\Facades\Log;

class ScanTagger
{
    /**
     * Tag a scan with control-room relevant metadata.
     * Returns an array with tag information for storage/broadcasting.
     */
    public function tag(CheckpointScan $scan): array
    {
        // Basic tags: supervisor, site, client, time, location accuracy
        $tags = [];

        $tags['scan_id'] = $scan->id;
        $tags['supervisor_id'] = $scan->supervisor_id;
        $tags['checkpoint_id'] = $scan->checkpoint_id;

        $clientSite = optional($scan->checkpoint->clientSite);
        $tags['site_id'] = $clientSite->id ?? null;
        $tags['site_name'] = $clientSite->name ?? null;
        $tags['client_name'] = optional($clientSite->client)->name ?? null;

        $tags['scanned_at'] = $scan->scanned_at ? $scan->scanned_at->toIso8601String() : now()->toIso8601String();
        $tags['latitude'] = $scan->latitude;
        $tags['longitude'] = $scan->longitude;
        $tags['location_verified'] = (bool) $scan->location_verified;

        // Compute a human friendly location quality
        if ($scan->location_verified) {
            $tags['location_quality'] = 'high';
        } elseif ($scan->latitude && $scan->longitude) {
            $tags['location_quality'] = 'medium';
        } else {
            $tags['location_quality'] = 'low';
        }

        // Example: add a geo-hash for quick indexing (lightweight)
        try {
            $tags['geohash'] = $this->geohash($scan->latitude, $scan->longitude);
        } catch (\Throwable $e) {
            Log::warning('Geohash generation failed: ' . $e->getMessage());
            $tags['geohash'] = null;
        }

        // Add any other control-room tags as needed (shift id, zone id, etc.)
        $tags['zone_id'] = optional($clientSite)->zone_id ?? null;

        return $tags;
    }

    protected function geohash($lat, $lon, $precision = 7)
    {
        if (!$lat || !$lon) return null;
        $base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
        $lat_interval = [-90.0, 90.0];
        $lon_interval = [-180.0, 180.0];
        $geohash = '';
        $even = true;
        $bit = 0;
        $ch = 0;

        while (strlen($geohash) < $precision) {
            if ($even) {
                $mid = array_sum($lon_interval) / 2;
                if ($lon > $mid) {
                    $ch |= (1 << (4 - $bit));
                    $lon_interval[0] = $mid;
                } else {
                    $lon_interval[1] = $mid;
                }
            } else {
                $mid = array_sum($lat_interval) / 2;
                if ($lat > $mid) {
                    $ch |= (1 << (4 - $bit));
                    $lat_interval[0] = $mid;
                } else {
                    $lat_interval[1] = $mid;
                }
            }

            $even = !$even;

            if ($bit < 4) {
                $bit++;
            } else {
                $geohash .= $base32[$ch];
                $bit = 0;
                $ch = 0;
            }
        }

        return $geohash;
    }
}
