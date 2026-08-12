<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use App\Models\Guards\CheckpointScan;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Checkpoint;
use App\Models\Guards\Attendance;
use App\Models\AuditLog;
use App\Models\GPSMismatchIncident;
use App\Services\SiteScanLockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Session;
use App\Events\QRScanned;
use App\Jobs\TagScanJob;
use App\Notifications\GenericDbNotification;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class SiteScanController extends Controller
{
    /**
     * Handle site QR code scan
     */
    public function scan(Request $request, ?ClientSite $site = null)
    {
        $user = Auth::user();
        $roleName = (string) ($user?->role ?? ($user?->getRoleNames()?->first() ?? ''));
        $requireGps = config('scanner.require_gps', true);
        $siteRadius = config('scanner.site_radius_meters', 10);

        // Support both route-model binding and query parameter
        if (!$site || !$site->exists) {
            $siteId = $request->input('site');
            if (!$siteId) {
                if ($request->header('X-Inertia')) {
                    throw ValidationException::withMessages([
                        'site' => 'No site specified. Please scan a valid QR code at the client site.',
                    ]);
                }
                return $this->errorResponse('No site specified. Please scan a valid QR code at the client site.', 400);
            }
            $site = ClientSite::find($siteId);
            if (!$site) {
                if ($request->header('X-Inertia')) {
                    throw ValidationException::withMessages([
                        'site' => 'Site not found. The QR code may be expired or invalid. Please contact your supervisor or try scanning again.',
                    ]);
                }
                return $this->errorResponse('Site not found. The QR code may be expired or invalid. Please contact your supervisor or try scanning again.', 404);
            }
        }

        // Get GPS coordinates from request
        $latitude = $request->input('latitude');
        $longitude = $request->input('longitude');

        // Validate GPS is provided if required
        if ($requireGps && (($latitude === null || $latitude === '') || ($longitude === null || $longitude === ''))) {
            $this->logFailedScan($user, $site, 'GPS coordinates required but not provided', $latitude, $longitude);
            
            $errorMessage = 'GPS location is required. Please:\n1. Enable location services in your browser settings\n2. Allow location access when prompted\n3. Ensure you are outdoors or have a clear GPS signal\n4. Try scanning again';
            
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'gps' => $errorMessage,
                ]);
            }
            return $this->errorResponse($errorMessage, 400);
        }

        // Location verification (within configurable radius of site)
        $locationVerified = false;
        $distance = null;
        if (($latitude !== null && $latitude !== '') && ($longitude !== null && $longitude !== '')
            && ($site->latitude !== null && $site->latitude !== '') && ($site->longitude !== null && $site->longitude !== '')) {
            $distance = $this->haversineDistance(
                $latitude,
                $longitude,
                $site->latitude,
                $site->longitude
            );
            $locationVerified = $distance <= $siteRadius;
        }

        // Block scan if location verification fails and GPS is required
        if ($requireGps && !$locationVerified) {
            $distanceText = $distance !== null ? round($distance, 0) : 'unknown';
            $errorMessage = "Location verification failed. You are {$distanceText} meters away from the site.\\n\\nYou must be within {$siteRadius} meters to scan.\\n\\nTo fix this:\n1. Make sure you are at the correct site location\n2. Check if the site GPS coordinates are accurate in the system\n3. Contact your supervisor if you believe you are at the correct location\n4. Try again when you are closer to the site";
            
            $this->logFailedScan($user, $site, 'GPS mismatch - ' . $distanceText . 'm from site', $latitude, $longitude, $distance);

            $threshold = (int) config('scanner.gps_mismatch_alert_threshold', 3);
            $windowMinutes = (int) config('scanner.gps_mismatch_alert_window_minutes', 10);
            $cacheKey = 'gps_mismatch:' . (int) $user->id . ':' . (int) $site->id;
            $mismatchCount = (int) Cache::increment($cacheKey);
            Cache::put($cacheKey, $mismatchCount, now()->addMinutes($windowMinutes));
            $escalated = $mismatchCount >= $threshold;

            try {
                GPSMismatchIncident::create([
                    'user_id' => $user->id,
                    'site_id' => $site->id,
                    'checkpoint_id' => null,
                    'scan_type' => 'site',
                    'attempted_latitude' => $latitude,
                    'attempted_longitude' => $longitude,
                    'expected_latitude' => $site->latitude,
                    'expected_longitude' => $site->longitude,
                    'distance_meters' => $distance !== null ? (int) round($distance, 0) : null,
                    'radius_meters' => (int) $siteRadius,
                    'mismatch_count' => $mismatchCount,
                    'threshold' => $threshold,
                    'window_minutes' => $windowMinutes,
                    'escalated' => $escalated,
                    'message' => 'GPS verification failed. User attempted scan from invalid location.',
                    'occurred_at' => now(),
                ]);
            } catch (\Throwable $e) {
            }

            // Dispatch event for real-time alert
            event(new \App\Events\GPSMismatchAlert(
                $user->id,
                $site->id,
                $site->name,
                $latitude,
                $longitude,
                $site->latitude,
                $site->longitude,
                $distance,
                $mismatchCount,
                $threshold,
                $windowMinutes,
                $escalated
            ));

            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'gps' => $errorMessage,
                ]);
            }
            return $this->errorResponse($errorMessage, 403, [
                'distance_meters' => $distance,
                'required_radius' => $siteRadius,
                'location_verified' => false,
            ]);
        }

        // Get or create default checkpoint for this site
        $checkpoint = Checkpoint::firstOrCreate(
            ['client_site_id' => $site->id, 'name' => 'Main Entrance'],
            [
                'description' => 'Default checkpoint for site scans',
                'code' => $site->qr_code ?? 'CHK-' . $site->id,
                'type' => 'qr',
                'is_active' => true,
                'requires_photo' => false,
                'scan_radius_meters' => $siteRadius,
                'latitude' => $site->latitude,
                'longitude' => $site->longitude,
            ]
        );

        // Create the scan record
        $scan = CheckpointScan::create([
            'checkpoint_id' => $checkpoint->id,
            'supervisor_id' => $user->id,
            'scanned_at' => now(),
            'latitude' => $latitude,
            'longitude' => $longitude,
            'device_info' => $request->userAgent(),
            'location_verified' => $locationVerified,
            'notes' => 'Site QR scan via ' . $roleName,
        ]);

        // Tag the scan immediately (synchronous) to ensure it appears in control-room dashboard
        // This avoids requiring a queue worker on the live server.
        // Wrapped in try/catch so a job failure (e.g. broadcasting, DB) never causes a 500 response.
        try {
            TagScanJob::dispatchSync($scan->id);
        } catch (\Throwable $e) {
            \Log::error('SiteScan: TagScanJob failed (non-fatal)', [
                'scan_id' => $scan->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        // Dispatch event for real-time notifications (control-room + supervisor private channel)
        // Broadcasting failures (e.g. Pusher SSL) must not break scan HTTP flows.
        try {
            event(new QRScanned(
                $user->id,
                'Site scanned successfully',
                [
                    'id' => $scan->id,
                    'supervisor_name' => $user->name,
                    'site_name' => $site->name,
                    'client_name' => (string) ($site->client?->name ?? ''),
                    'scanned_at' => $scan->scanned_at ? $scan->scanned_at->toIso8601String() : now()->toIso8601String(),
                    'location_verified' => (bool) $locationVerified,
                    'latitude' => $latitude !== null ? (float) $latitude : null,
                    'longitude' => $longitude !== null ? (float) $longitude : null,
                ]
            ));
        } catch (\Throwable $broadcastError) {
            \Log::warning('SiteScanController: QRScanned broadcast failed (non-fatal)', [
                'scan_id' => $scan->id ?? null,
                'user_id' => $user->id ?? null,
                'site_id' => $site->id ?? null,
                'error' => $broadcastError->getMessage(),
            ]);
        }

        // Send push notification to control room operators
        try {
            $controlRoomUsers = \App\Models\User::role(['control_room_operator', 'operations_officer', 'admin', 'super_admin'])->get();
            if ($controlRoomUsers->isNotEmpty()) {
                Notification::send($controlRoomUsers, new GenericDbNotification([
                    'title' => 'Site QR Scanned',
                    'message' => sprintf('%s scanned %s', $user->name, $site->name),
                    'url' => route('control-room.dashboard'),
                ]));
            }
        } catch (\Throwable $e) {
            // swallow notification errors
        }

        // Determine redirect based on role
        $managementRoles = ['supervisor', 'zone_commander', 'sergeant'];

        if (in_array($roleName, $managementRoles) || $user->hasAnyRole($managementRoles)) {
            // Check if attendance already taken today
            $attendance = Attendance::where('supervisor_id', $user->id)
                ->whereDate('date', today())
                ->where('client_site_id', $site->id)
                ->first();

            if (!$attendance) {
                // No attendance for today - redirect to attendance page
                Session::flash('scan_notice', 'Site verified. Please record your attendance.');

                if ($request->header('X-Inertia')) {
                    return redirect()->route('supervisor.attendance', ['site' => $site->id]);
                }

                return response()->json([
                    'success' => true,
                    'scan_id' => $scan->id,
                    'redirect' => route('supervisor.attendance', ['site' => $site->id]),
                    'message' => 'Site verified. Please record your attendance.',
                    'location_verified' => $locationVerified,
                ]);
            }
        }

        // Store scan lock in database (survives across devices, configurable TTL)
        app(SiteScanLockService::class)->setLock(
            userId: $user->id,
            clientSiteId: $site->id,
            checkpointId: $checkpoint->id,
            scanId: $scan->id,
            ttlMinutes: (int) config('scanner.lock_minutes', 120)
        );

        // Flash success message
        Session::flash('scan_success', 'Scan recorded successfully. Site: ' . $site->name);

        // Redirect based on role
        if ($request->header('X-Inertia')) {
            return $this->getRoleBasedRedirect($user, $site, $scan, $locationVerified);
        }

        return response()->json([
            'success' => true,
            'scan_id' => $scan->id,
            'site_id' => $site->id,
            'site_name' => $site->name,
            'location_verified' => $locationVerified,
            'message' => 'Scan recorded as patrol check.',
        ]);
    }

    /**
     * Get role-based redirect after scan - all roles go back with toast
     */
    private function getRoleBasedRedirect($user, $site, $scan, $locationVerified)
    {
        $roleName = (string) ($user?->role ?? ($user?->getRoleNames()?->first() ?? ''));

        switch ($roleName) {
            case 'trainer':
                return redirect()->route('training.dashboard')->with('success', 'Patrol recorded at ' . $site->name);

            case 'hr':
            case 'human_resources':
            case 'hr_manager':
                return redirect()->route('hr.dashboard')->with('success', 'Patrol recorded at ' . $site->name);

            case 'asset_manager':
            case 'assets_manager':
                return redirect()->route('assets.index')->with('success', 'Patrol recorded at ' . $site->name);

            case 'business_dev':
            case 'business_development':
            case 'bdo':
                return redirect()->route('admin.business-dev')->with('success', 'Patrol recorded at ' . $site->name);

            case 'marketing':
            case 'marketing_officer':
            case 'marketing_manager':
                return redirect()->route('admin.marketing')->with('success', 'Patrol recorded at ' . $site->name);

            case 'finance_officer':
            case 'accountant':
            case 'finance':
            case 'accounting':
                return redirect()->route('finance.index')->with('success', 'Patrol recorded at ' . $site->name);

            case 'client':
                return redirect()->route('client.dashboard')->with('success', 'Patrol recorded at ' . $site->name);

            case 'guard':
            case 'reliever':
                return redirect()->route('guard.dashboard')->with('success', 'Patrol recorded at ' . $site->name);

            default:
                // Check if user has super_admin role
                if (auth()->user()->hasRole('super_admin')) {
                    return redirect()->route('superadmin.dashboard')->with('success', 'Patrol recorded at ' . $site->name);
                }
                if (auth()->user()->hasRole('admin')) {
                    return redirect()->route('admin.dashboard')->with('success', 'Patrol recorded at ' . $site->name);
                }
                if (auth()->user()->hasRole('control_room_operator')) {
                    return redirect()->route('control-room.dashboard')->with('success', 'Patrol recorded at ' . $site->name);
                }
              
                return redirect()->back()->with('success', 'Patrol recorded at ' . $site->name);
        }
    }

    /**
     * Show the scanner page for site QR codes.
     */
    public function showScanner()
    {
        $activeScan = app(SiteScanLockService::class)->getActiveLock(auth()->id());

        return Inertia::render('Supervisor/SiteScanner', [
            'activeScan' => $activeScan,
        ]);
    }

    /**
     * Clear the active site scan lock.
     */
    public function clearScan()
    {
        app(SiteScanLockService::class)->clearLock(auth()->id());
        return back()->with('info', 'Site lock cleared.');
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

    /**
     * Log a failed scan attempt to audit log
     */
    /**
     * Report a site that was not found via QR scan (manual fallback).
     * Creates an audit log entry + notification so the control room can map it.
     */
    public function reportNotFound(Request $request)
    {
        $validated = $request->validate([
            'site_name' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'accuracy' => 'nullable|numeric',
        ]);

        $user = Auth::user();

        // Log to audit so control room operators can see it
        AuditLog::create([
            'user_id' => $user?->id,
            'action' => 'site_not_found_reported',
            'entity_type' => \App\Models\Guards\ClientSite::class,
            'entity_id' => null,
            'description' => "User '{$user?->name}' reported site '{$validated['site_name']}' not found. GPS: {$validated['latitude']}, {$validated['longitude']}",
            'old_values' => [],
            'new_values' => [
                'site_name' => $validated['site_name'],
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'accuracy' => $validated['accuracy'],
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with(
            'success',
            "Site '{$validated['site_name']}' reported. Control room will map it."
        );
    }

    private function logFailedScan($user, $site, string $reason, ?float $userLat, ?float $userLng, ?float $distance = null): void
    {
        try {
            AuditLog::create([
                'user_id' => $user?->id,
                'action' => 'gps_verification_failed',
                'entity_type' => ClientSite::class,
                'entity_id' => $site?->id,
                'description' => "GPS verification failed for site '{$site?->name}' by user '{$user?->name}' ({$user?->role})",
                'old_values' => [
                    'site_coordinates' => [
                        'lat' => $site?->latitude,
                        'lng' => $site?->longitude,
                    ],
                    'required_radius' => config('scanner.site_radius_meters', 100),
                ],
                'new_values' => [
                    'user_coordinates' => [
                        'lat' => $userLat,
                        'lng' => $userLng,
                    ],
                    'distance_meters' => $distance,
                    'failure_reason' => $reason,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Throwable $e) {
            // Silently fail logging - don't block the user flow
            \Log::warning('Failed to log GPS verification failure', [
                'error' => $e->getMessage(),
                'user_id' => $user?->id,
                'site_id' => $site?->id,
            ]);
        }
    }
}
