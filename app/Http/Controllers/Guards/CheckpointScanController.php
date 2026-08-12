<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use App\Models\Guards\{Checkpoint, CheckpointScan};
use App\Models\GPSMismatchIncident;
use App\Services\SiteScanLockService;
use App\Events\QRScanned;
use App\Jobs\TagScanJob;
use App\Notifications\GenericDbNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class CheckpointScanController extends Controller
{
    public function scan(Request $request)
    {
        $requireGps = config('scanner.require_gps', true);
        $validated = $request->validate([
            'code' => 'required|string',
            'latitude' => ($requireGps ? 'required' : 'nullable') . '|numeric',
            'longitude' => ($requireGps ? 'required' : 'nullable') . '|numeric',
            'accuracy' => 'nullable|numeric|min:0', // GPS accuracy in meters
        ]);

        $checkpoint = Checkpoint::where('code', $validated['code'])
            ->active()
            ->with('clientSite.client')
            ->first();

        if (!$checkpoint) {
            $msg = 'Invalid or inactive checkpoint code.\n\nPlease:\n1. Verify you scanned the correct QR code\n2. Check if the checkpoint is still active in the system\n3. Contact your supervisor if the issue persists\n4. Use manual entry with the checkpoint code if available';
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages(['code' => $msg]);
            }
            return back()->with('error', $msg);
        }

        // Verify location if GPS coordinates provided
        $locationVerified = false;
        $verificationResult = null;
        if (isset($validated['latitude']) && isset($validated['longitude'])) {
            $accuracy = $validated['accuracy'] ?? null;
            $verificationResult = $checkpoint->verifyLocation(
                $validated['latitude'],
                $validated['longitude'],
                $accuracy
            );
            $locationVerified = $verificationResult['verified'];

            if (!$locationVerified && $checkpoint->latitude && $checkpoint->longitude) {
                $radiusMeters = (int) ($checkpoint->scan_radius_meters ?: 0);
                if ($radiusMeters <= 0) {
                    $radiusMeters = (int) config('scanner.checkpoint_radius_meters', 100);
                }
                $effectiveRadius = $verificationResult['effective_radius'] ?? $radiusMeters;

                $threshold = (int) config('scanner.gps_mismatch_alert_threshold', 3);
                $windowMinutes = (int) config('scanner.gps_mismatch_alert_window_minutes', 10);
                $siteId = (int) $checkpoint->client_site_id;
                $cacheKey = 'gps_mismatch:' . (int) auth()->id() . ':' . $siteId;
                $mismatchCount = (int) Cache::increment($cacheKey);
                Cache::put($cacheKey, $mismatchCount, now()->addMinutes($windowMinutes));
                $escalated = $mismatchCount >= $threshold;

                $distance = $verificationResult['distance'] ?? 0;
                $accuracyUsed = $verificationResult['accuracy_used'] ?? null;

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
                    $escalated,
                    $accuracyUsed,
                    $effectiveRadius
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
                        'gps_accuracy' => $accuracyUsed,
                        'effective_radius_meters' => $effectiveRadius,
                        'mismatch_count' => $mismatchCount,
                        'threshold' => $threshold,
                        'window_minutes' => $windowMinutes,
                        'escalated' => $escalated,
                        'message' => 'GPS verification failed. User attempted scan from invalid location.',
                        'occurred_at' => now(),
                    ]);
                } catch (\Throwable $e) {
                    \Log::warning('CheckpointScanController: failed to create GPSMismatchIncident', [
                        'error' => $e->getMessage(),
                        'user_id' => auth()->id(),
                        'site_id' => $siteId,
                        'checkpoint_id' => $checkpoint->id,
                    ]);
                }

                $accuracyMsg = $accuracyUsed ? "\nGPS accuracy: ±" . round($accuracyUsed) . 'm' : '';
                $errorMessage = 'Location verification failed. You are ' . round($distance) . 'm away (allowed: ' . $effectiveRadius . 'm' . $accuracyMsg . ').\n\nTo fix this:\n1. Make sure you are at the correct checkpoint location\n2. Move outdoors for better GPS signal\n3. Wait 10-30 seconds for GPS to stabilize\n4. Try refreshing your location before scanning\n5. Contact your supervisor if you are at the correct location';
                if ($request->header('X-Inertia')) {
                    throw ValidationException::withMessages(['gps' => $errorMessage]);
                }
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

        // Store scan lock in database (survives across devices, configurable TTL)
        app(SiteScanLockService::class)->setLock(
            userId: (int) auth()->id(),
            clientSiteId: (int) $checkpoint->client_site_id,
            checkpointId: (int) $checkpoint->id,
            scanId: (int) $scan->id,
            ttlMinutes: (int) config('scanner.lock_minutes', 120)
        );

        $scanData = app(SiteScanLockService::class)->getActiveLock((int) auth()->id());

        // Tag the scan immediately (synchronous) to ensure it appears in control-room dashboard
        // This avoids requiring a queue worker on the live server.
        // Wrapped in try/catch so a job failure (e.g. broadcasting, DB) never causes a 500 response.
        try {
            TagScanJob::dispatchSync($scan->id);
        } catch (\Throwable $e) {
            \Log::error('CheckpointScan: TagScanJob failed (non-fatal)', [
                'scan_id' => $scan->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        // Dispatch event for real-time notifications (comprehensive payload)
        // Broadcasting failures (e.g. Pusher SSL) must not break scan HTTP flows.
        try {
            event(new \App\Events\QRScanned(
                auth()->id(),
                "Checkpoint scanned successfully",
                [
                    'id' => $scan->id,
                    'supervisor_name' => auth()->user()->name,
                    'checkpoint_id' => $checkpoint->id,
                    'checkpoint_name' => $checkpoint->name,
                    'checkpoint_code' => $checkpoint->code,
                    'site_name' => optional($checkpoint->clientSite)->name ?? 'Unknown',
                    'client_name' => optional($checkpoint->clientSite?->client)->name ?? 'Unknown',
                    'scanned_at' => optional($scan->scanned_at)->toIso8601String() ?? now()->toIso8601String(),
                    'location_verified' => $locationVerified,
                    'latitude' => $validated['latitude'] ?? null,
                    'longitude' => $validated['longitude'] ?? null,
                ]
            ));
        } catch (\Throwable $broadcastError) {
            \Log::warning('CheckpointScanController: QRScanned broadcast failed (non-fatal)', [
                'scan_id' => $scan->id ?? null,
                'user_id' => auth()->id(),
                'checkpoint_id' => $checkpoint->id ?? null,
                'error' => $broadcastError->getMessage(),
            ]);
        }

        // Send push notification to control room operators
        try {
            $controlRoomUsers = \App\Models\User::role(['control_room_operator', 'operations_officer', 'admin', 'super_admin'])->get();
            if ($controlRoomUsers->isNotEmpty()) {
                Notification::send($controlRoomUsers, new GenericDbNotification([
                    'title' => 'Checkpoint QR Scanned',
                    'message' => sprintf('%s scanned checkpoint "%s" at %s', auth()->user()->name, $checkpoint->name, $checkpoint->clientSite->name),
                    'url' => route('control-room.dashboard'),
                ]));
            }
        } catch (\Throwable $e) {
            // swallow notification errors
        }

        // Get role-based redirect route
        $roleName = (string) (auth()->user()?->role ?? (auth()->user()?->getRoleNames()?->first() ?? ''));
        $redirectRoute = $this->getRoleBasedRedirectRoute($roleName ?: 'supervisor');

        if ($request->header('X-Inertia')) {
            return redirect()->route($redirectRoute)
                ->with('success', 'Checkpoint scanned successfully')
                ->with('location_verified', $locationVerified)
                ->with('scan', $scanData);
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
        $activeScan = app(SiteScanLockService::class)->getActiveLock((int) auth()->id());
        
        return Inertia::render('Supervisor/Scanner', [
            'activeScan' => $activeScan,
        ]);
    }

    public function clearScan()
    {
        app(SiteScanLockService::class)->clearLock((int) auth()->id());
        
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
