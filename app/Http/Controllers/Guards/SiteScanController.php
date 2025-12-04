<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use App\Models\Guards\ClientSite;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SiteScanController extends Controller
{
    public function scan(Request $request, ClientSite $site)
    {
        $requireGps = config('scanner.require_gps', true);
        $validated = $request->validate([
            'latitude' => ($requireGps ? 'required' : 'nullable') . '|numeric',
            'longitude' => ($requireGps ? 'required' : 'nullable') . '|numeric',
        ]);

        // Verify location if site has coordinates
        $locationVerified = false;
        $lat = $validated['latitude'] ?? null;
        $lng = $validated['longitude'] ?? null;

        if ($lat !== null && $lng !== null && $site->latitude && $site->longitude) {
            $distance = $this->haversineDistance((float)$lat, (float)$lng, (float)$site->latitude, (float)$site->longitude);
            $radius = (float) config('scanner.scan_radius_meters', 150);
            if ($distance <= $radius) {
                $locationVerified = true;
            } else {
                return back()->with('error', 'Location verification failed. You must be within ' . $radius . ' meters of the site.');
            }
        }

        // Create session lock for attendance
        $scanData = [
            'scan_id' => null,
            'checkpoint_id' => null,
            'site_id' => $site->id,
            'site_name' => $site->name,
            'client_name' => optional($site->client)->name,
            'scanned_at' => now()->toIso8601String(),
            'expires_at' => now()->addMinutes(config('scanner.lock_minutes', 120))->toIso8601String(),
            'location_verified' => $locationVerified,
            'latitude' => $lat,
            'longitude' => $lng,
        ];

        session(['active_checkpoint_scan' => $scanData]);

        if ($request->header('X-Inertia')) {
            return redirect()->route('supervisor.attendance')
                ->with('success', 'Site scanned successfully');
        }

        return response()->json([
            'success' => true,
            'message' => 'Site scanned successfully',
            'redirect' => route('supervisor.attendance'),
            'scan' => $scanData,
        ]);
    }

    private function haversineDistance(float $latFrom, float $lonFrom, float $latTo, float $lonTo): float
    {
        $earthRadius = 6371000; // meters
        $latFromRad = deg2rad($latFrom);
        $lonFromRad = deg2rad($lonFrom);
        $latToRad = deg2rad($latTo);
        $lonToRad = deg2rad($lonTo);

        $latDelta = $latToRad - $latFromRad;
        $lonDelta = $lonToRad - $lonFromRad;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) + cos($latFromRad) * cos($latToRad) * pow(sin($lonDelta / 2), 2)));
        return $earthRadius * $angle;
    }
}
