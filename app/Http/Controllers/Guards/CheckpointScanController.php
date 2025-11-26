<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use App\Models\Guards\{Checkpoint, CheckpointScan};
use App\Jobs\TagScanJob;
use Illuminate\Http\Request;
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
            return back()->with('error', 'Invalid or inactive checkpoint code.');
        }

        // Verify location if GPS coordinates provided
        $locationVerified = false;
        if (isset($validated['latitude']) && isset($validated['longitude'])) {
            $locationVerified = $checkpoint->verifyLocation(
                $validated['latitude'],
                $validated['longitude']
            );

            if (!$locationVerified && $checkpoint->latitude && $checkpoint->longitude) {
                return back()->with('error', 'Location verification failed. You must be within ' . $checkpoint->scan_radius_meters . ' meters of the checkpoint.');
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
                'scanned_at' => $scan->scanned_at->toISOString(),
                'location_verified' => $locationVerified,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
            ]
        ));

        if ($request->header('X-Inertia')) {
            return redirect()->route('supervisor.attendance')
                ->with('success', 'Checkpoint scanned successfully');
        }

        return response()->json([
            'success' => true,
            'message' => 'Checkpoint scanned successfully',
            'redirect' => route('supervisor.attendance'),
            'scan' => $scanData,
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
}