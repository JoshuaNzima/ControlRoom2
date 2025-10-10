<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Camera;
use App\Models\CameraRecording;
use App\Models\CameraAlert;
use App\Models\Guards\ClientSite;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CameraController extends Controller
{
    public function index(Request $request)
    {
        $cameras = Camera::with(['site'])
            ->when($request->site_id, function ($query, $siteId) {
                return $query->where('client_site_id', $siteId);
            })
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->latest()
            ->paginate(20);

        $sites = ClientSite::select('id', 'name')->get();

        return Inertia::render('ControlRoom/Cameras/Index', [
            'cameras' => $cameras,
            'sites' => $sites,
            'filters' => [
                'types' => Camera::TYPES,
                'statuses' => Camera::STATUSES,
            ]
        ]);
    }

    public function show(Camera $camera)
    {
        $camera->load(['site']);
        
        $recentRecordings = $camera->recordings()
            ->latest()
            ->take(5)
            ->get();

        $activeAlerts = $camera->alerts()
            ->where('status', 'active')
            ->latest()
            ->get();

        return Inertia::render('ControlRoom/Cameras/Show', [
            'camera' => $camera,
            'recentRecordings' => $recentRecordings,
            'activeAlerts' => $activeAlerts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client_site_id' => 'required|exists:client_sites,id',
            'stream_url' => 'required|url',
            'type' => 'required|in:' . implode(',', Camera::TYPES),
            'location' => 'nullable|string|max:255',
            'recording_enabled' => 'boolean',
            'retention_days' => 'integer|min:1|max:365',
            'credentials' => 'nullable|array',
            'settings' => 'nullable|array',
        ]);

        $camera = Camera::create($validated);

        return redirect()
            ->route('control-room.cameras.show', $camera)
            ->with('success', 'Camera added successfully.');
    }

    public function update(Request $request, Camera $camera)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'stream_url' => 'sometimes|required|url',
            'type' => 'sometimes|required|in:' . implode(',', Camera::TYPES),
            'location' => 'nullable|string|max:255',
            'recording_enabled' => 'boolean',
            'retention_days' => 'integer|min:1|max:365',
            'credentials' => 'nullable|array',
            'settings' => 'nullable|array',
        ]);

        $camera->update($validated);

        return back()->with('success', 'Camera updated successfully.');
    }

    public function destroy(Camera $camera)
    {
        $camera->delete();

        return redirect()
            ->route('control-room.cameras.index')
            ->with('success', 'Camera removed successfully.');
    }

    public function getRecordings(Camera $camera, Request $request)
    {
        $recordings = $camera->recordings()
            ->when($request->date, function ($query, $date) {
                return $query->whereDate('start_time', $date);
            })
            ->when($request->type, function ($query, $type) {
                return $query->where('type', $type);
            })
            ->latest()
            ->paginate(10);

        return response()->json($recordings);
    }

    public function downloadRecording(CameraRecording $recording)
    {
        // Implement secure file download logic
        if (!file_exists($recording->file_path)) {
            return back()->with('error', 'Recording file not found.');
        }

        return response()->download($recording->file_path);
    }

    public function acknowledgeAlert(CameraAlert $alert)
    {
        $alert->update([
            'status' => 'acknowledged',
            'acknowledged_by' => auth()->id(),
            'acknowledged_at' => now(),
        ]);

        return back()->with('success', 'Alert acknowledged.');
    }

    public function resolveAlert(CameraAlert $alert)
    {
        $alert->update([
            'status' => 'resolved',
        ]);

        return back()->with('success', 'Alert marked as resolved.');
    }
}