<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use App\Models\Guards\CheckpointScan;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Checkpoint;
use App\Models\Guards\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use App\Events\QRScanned;
use Inertia\Inertia;

class SiteScanController extends Controller
{
    /**
     * Handle site QR code scan
     */
    public function scan(Request $request, ?ClientSite $site = null)
    {
        $user = Auth::user();

        // Support both route-model binding and query parameter
        if (!$site || !$site->exists) {
            $siteId = $request->input('site');
            if (!$siteId) {
                if ($request->header('X-Inertia')) {
                    return redirect()->back()->with('error', 'No site specified.');
                }
                return response()->json(['error' => 'No site specified.'], 400);
            }
            $site = ClientSite::find($siteId);
            if (!$site) {
                if ($request->header('X-Inertia')) {
                    return redirect()->back()->with('error', 'Site not found.');
                }
                return response()->json(['error' => 'Site not found.'], 404);
            }
        }

        // Get GPS coordinates from request
        $latitude = $request->input('latitude');
        $longitude = $request->input('longitude');

        // Simple location verification (within 100m of site)
        $locationVerified = false;
        if ($latitude && $longitude && $site->latitude && $site->longitude) {
            $distance = $this->haversineDistance(
                $latitude,
                $longitude,
                $site->latitude,
                $site->longitude
            );
            $locationVerified = $distance <= 100; // 100 meters
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
                'scan_radius_meters' => 100,
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
            'notes' => 'Site QR scan via ' . $user->role,
        ]);

        // Dispatch QR scanned event
        event(new QRScanned($user, $site, $scan));

        // Determine redirect based on role
        $managementRoles = ['supervisor', 'zone_commander', 'sergeant'];

        if (in_array($user->role, $managementRoles)) {
            // Check if attendance already taken today
            $attendance = Attendance::where('supervisor_id', $user->id)
                ->whereDate('scanned_at', today())
                ->where('site_id', $site->id)
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

        // For non-management roles OR if attendance already taken
        // Store scan info in session for display
        Session::put('active_checkpoint_scan', [
            'scan_id' => $scan->id,
            'site_id' => $site->id,
            'site_name' => $site->name,
            'checkpoint_id' => $checkpoint->id,
            'scanned_at' => now()->toIso8601String(),
            'latitude' => $latitude,
            'longitude' => $longitude,
            'location_verified' => $locationVerified,
        ]);

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
        switch ($user->role) {
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

            case 'manager':
                return redirect()->route('manager.dashboard')->with('success', 'Patrol recorded at ' . $site->name);

            case 'client':
                return redirect()->route('client.dashboard')->with('success', 'Patrol recorded at ' . $site->name);

            case 'guard':
            case 'reliever':
                return redirect()->route('guard.dashboard')->with('success', 'Patrol recorded at ' . $site->name);

            default:
                return redirect()->back()->with('success', 'Patrol recorded at ' . $site->name);
        }
    }

    /**
     * Show the scanner page for site QR codes.
     */
    public function showScanner()
    {
        $activeScan = session('active_checkpoint_scan');

        return Inertia::render('Supervisor/SiteScanner', [
            'activeScan' => $activeScan,
        ]);
    }

    /**
     * Clear the active site scan lock.
     */
    public function clearScan()
    {
        session()->forget('active_checkpoint_scan');
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
}
