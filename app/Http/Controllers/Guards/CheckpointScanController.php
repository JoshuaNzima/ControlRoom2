<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use App\Models\Guards\{Checkpoint, CheckpointScan};
use App\Jobs\TagScanJob;
use App\Models\GPSMismatchIncident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class CheckpointScanController extends Controller
{
    public function scan(Request $request)
    {
        $requireGps = config('scanner.require_gps', true);
        $validated = $request->validate([
            'code' => 'required|string',
            'latitude' => ($requireGps ? 'required' : 'nullable') . '|numeric',
            'longitude' => ($requireGps ? 'required' : 'nullable') . '|numeric',
        ]);

        $checkpoint = Checkpoint::where('code', $validated['code'])
            ->active()
            ->with('clientSite.client')
            ->first();

        if (!$checkpoint) {
            return back()->with('error', 'Invalid or inactive checkpoint code.\\n\\nPlease:\n1. Verify you scanned the correct QR code\n2. Check if the checkpoint is still active in the system\n3. Contact your supervisor if the issue persists\n4. Use manual entry with the checkpoint code if available');
        }

        // Verify location if GPS coordinates provided
        $locationVerified = false;
        if (isset($validated['latitude']) && isset($validated['longitude'])) {
            $locationVerified = $checkpoint->verifyLocation(
                $validated['latitude'],
                $validated['longitude']
            );

            if (!$locationVerified && $checkpoint->latitude && $checkpoint->longitude) {
                $radiusMeters = (int) ($checkpoint->scan_radius_meters ?: 0);
                if ($radiusMeters <= 0) {
                    $radiusMeters = (int) config('scanner.checkpoint_radius_meters', 10);
                }

                $threshold = (int) config('scanner.gps_mismatch_alert_threshold', 3);
                $windowMinutes = (int) config('scanner.gps_mismatch_alert_window_minutes', 10);
                $siteId = (int) $checkpoint->client_site_id;
                $cacheKey = 'gps_mismatch:' . (int) auth()->id() . ':' . $siteId;
                $mismatchCount = (int) Cache::increment($cacheKey);
                Cache::put($cacheKey, $mismatchCount, now()->addMinutes($windowMinutes));
                $escalated = $mismatchCount >= $threshold;

                $distance = null;
                try {
                    $earthRadius = 6371000;
                    $latFrom = deg2rad((float) $checkpoint->latitude);
                    $lonFrom = deg2rad((float) $checkpoint->longitude);
                    $latTo = deg2rad((float) $validated['latitude']);
                    $lonTo = deg2rad((float) $validated['longitude']);
                    $latDelta = $latTo - $latFrom;
                    $lonDelta = $lonTo - $lonFrom;
                    $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) + cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
                    $distance = $earthRadius * $angle;
                } catch (\Throwable $e) {
                }

                event(new \App\Events\GPSMismatchAlert(
                    (int) auth()->id(),
                    $siteId,
                    (string) optional($checkpoint->clientSite)->name,
                    (float) $validated['latitude'],
                    (float) $validated['longitude'],
                    $checkpoint->clientSite?->latitude !== null ? (float) $checkpoint->clientSite?->latitude : null,
                    $checkpoint->clientSite?->longitude !== null ? (float) $checkpoint->clientSite?->longitude : null,
                    $distance,
                    $mismatchCount,
                    $threshold,
                    $windowMinutes,
                    $escalated
                ));

                try {
                    GPSMismatchIncident::create([
                        'user_id' => (int) auth()->id(),
                        'site_id' => $siteId,
                        'checkpoint_id' => $checkpoint->id,
                        'scan_type' => 'checkpoint',
                        'attempted_latitude' => (float) $validated['latitude'],
                        'attempted_longitude' => (float) $validated['longitude'],
                        'expected_latitude' => $checkpoint->latitude !== null ? (float) $checkpoint->latitude : null,
                        'expected_longitude' => $checkpoint->longitude !== null ? (float) $checkpoint->longitude : null,
                        'distance_meters' => $distance !== null ? (int) round($distance, 0) : null,
                        'radius_meters' => $radiusMeters,
                        'mismatch_count' => $mismatchCount,
                        'threshold' => $threshold,
                        'window_minutes' => $windowMinutes,
                        'escalated' => $escalated,
                        'message' => 'GPS verification failed. User attempted scan from invalid location.',
                        'occurred_at' => now(),
                    ]);
                } catch (\Throwable $e) {
                }

                $errorMessage = 'Location verification failed. You are too far from the checkpoint.\\n\\nYou must be within ' . $radiusMeters . ' meters to scan.\\n\\nTo fix this:\n1. Make sure you are at the correct checkpoint location\n2. Ensure GPS signal is strong (move outdoors if needed)\n3. Wait a moment for GPS to stabilize and try again\n4. Contact your supervisor if you are at the correct location';
                return back()->with('error', $errorMessage);
            }
        }

        // Create scan record
        $scan = CheckpointScan::create([
            'checkpoint_id' => $checkpoint->id,
            'supervisor_id' => auth()->id(),
            'scanned_at' => now(),
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'device_info' => $request->userAgent(),
            'location_verified' => $locationVerified,
        ]);

        // Store scan in session to lock site for attendance
        $scanData = [
            'scan_id' => $scan->id,
            'checkpoint_id' => $checkpoint->id,
            'site_id' => $checkpoint->client_site_id,
            'site_name' => $checkpoint->clientSite->name,
            'client_name' => $checkpoint->clientSite->client->name,
            'scanned_at' => now()->toIso8601String(),
            'expires_at' => now()->addMinutes(config('scanner.lock_minutes', 120))->toIso8601String(),
        ];

        session(['active_checkpoint_scan' => $scanData]);

        // Dispatch tagging job (async) - job will persist scan tags to DB
        TagScanJob::dispatch($scan->id)->onQueue('default');

        // Dispatch event for real-time notifications (comprehensive payload)
        event(new \App\Events\QRScanned(
            auth()->id(),
            "Checkpoint scanned successfully",
            [
                'id' => $scan->id,
                'supervisor_name' => auth()->user()->name,
                'site_name' => $checkpoint->clientSite->name,
                'client_name' => $checkpoint->clientSite->client->name,
                'scanned_at' => $scan->scanned_at ? $scan->scanned_at->toIso8601String() : now()->toIso8601String(),
                'location_verified' => $locationVerified,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
            ]
        ));

        // Get role-based redirect route
        $userRole = auth()->user()->role;
        $redirectRoute = $this->getRoleBasedRedirectRoute($userRole);

        if ($request->header('X-Inertia')) {
            return redirect()->route($redirectRoute)
                ->with('success', 'Checkpoint scanned successfully')
                ->with('location_verified', $locationVerified);
        }

        return response()->json([
            'success' => true,
            'message' => 'Checkpoint scanned successfully',
            'redirect' => route($redirectRoute),
            'scan' => $scanData,
            'location_verified' => $locationVerified,
        ]);
    }

    public function showScanner()
    {
        $activeScan = session('active_checkpoint_scan');
        
        return Inertia::render('Supervisor/Scanner', [
            'activeScan' => $activeScan,
        ]);
    }

    public function clearScan()
    {
        session()->forget('active_checkpoint_scan');
        
        return back()->with('info', 'Site lock cleared.');
    }

    /**
     * Get the appropriate dashboard route based on user role
     */
    private function getRoleBasedRedirectRoute(string $role): string
    {
        return match($role) {
            'super_admin' => 'superadmin.dashboard',
            'admin' => 'admin.dashboard',
            'manager' => 'manager.dashboard',
            'control_room_operator' => 'control-room.dashboard',
            'operations_officer' => 'operations.dashboard',
            'zone_commander' => 'zone-commander.dashboard',
            'hr', 'human_resources', 'hr_manager' => 'hr.dashboard',
            'asset_manager', 'assets_manager' => 'assets.index',
            'finance_officer', 'accountant', 'finance', 'accounting' => 'finance.index',
            'trainer' => 'training.dashboard',
            'client' => 'client.dashboard',
            'guard', 'reliever' => 'guard.dashboard',
            default => 'supervisor.dashboard',
        };
    }
}