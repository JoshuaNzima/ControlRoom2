<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Camera;
use App\Models\CameraRecording;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class CameraController extends Controller
{
    public function index()
    {
        $cameras = Camera::with(['site', 'alerts'])
            ->latest()
            ->paginate(20);

        return Inertia::render('ControlRoom/Cameras/Index', [
            'cameras' => $cameras,
        ]);
    }

    public function create()
    {
        return Inertia::render('ControlRoom/Cameras/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'ip_address' => 'required|ip',
            'port' => 'required|integer|min:1|max:65535',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive,maintenance',
            'recording_enabled' => 'boolean',
            'motion_detection' => 'boolean',
            'night_vision' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $camera = Camera::create([
            ...$validated,
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('control-room.cameras.show', $camera)
            ->with('success', 'Camera added successfully.');
    }

    public function show(Camera $camera)
    {
        $camera->load(['site', 'alerts', 'recordings']);
        $recentRecordings = $camera->recordings()
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('ControlRoom/Cameras/Show', [
            'camera' => $camera,
            'recentRecordings' => $recentRecordings,
        ]);
    }

    public function edit(Camera $camera)
    {
        return Inertia::render('ControlRoom/Cameras/Edit', [
            'camera' => $camera,
        ]);
    }

    public function update(Request $request, Camera $camera)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'ip_address' => 'required|ip',
            'port' => 'required|integer|min:1|max:65535',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive,maintenance',
            'recording_enabled' => 'boolean',
            'motion_detection' => 'boolean',
            'night_vision' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $camera->update($validated);

        return redirect()->route('control-room.cameras.show', $camera)
            ->with('success', 'Camera updated successfully.');
    }

    public function destroy(Camera $camera)
    {
        $camera->delete();

        return redirect()->route('control-room.cameras.index')
            ->with('success', 'Camera deleted successfully.');
    }

    public function getRecordings(Camera $camera)
    {
        $recordings = $camera->recordings()
            ->latest()
            ->paginate(20);

        return Inertia::render('ControlRoom/Cameras/Recordings', [
            'camera' => $camera,
            'recordings' => $recordings,
        ]);
    }

    public function downloadRecording(CameraRecording $recording)
    {
        if (!Storage::exists($recording->file_path)) {
            abort(404, 'Recording file not found.');
        }

        return Storage::download($recording->file_path, $recording->filename);
    }

    public function acknowledgeAlert(Request $request, Camera $camera, $alertId)
    {
        $alert = $camera->alerts()->findOrFail($alertId);
        
        $alert->update([
            'status' => 'acknowledged',
            'acknowledged_by' => auth()->id(),
            'acknowledged_at' => now(),
        ]);

        return back()->with('success', 'Alert acknowledged successfully.');
    }

    public function resolveAlert(Request $request, Camera $camera, $alertId)
    {
        $alert = $camera->alerts()->findOrFail($alertId);
        
        $alert->update([
            'status' => 'resolved',
            'resolved_by' => auth()->id(),
            'resolved_at' => now(),
        ]);

        return back()->with('success', 'Alert resolved successfully.');
    }

    public function testConnection(Camera $camera)
    {
        // Simulate connection test
        $isConnected = $this->pingCamera($camera->ip_address, $camera->port);
        
        $camera->update([
            'last_connection_test' => now(),
            'connection_status' => $isConnected ? 'connected' : 'disconnected',
        ]);

        $message = $isConnected ? 'Camera connection successful.' : 'Camera connection failed.';
        $type = $isConnected ? 'success' : 'error';

        return back()->with($type, $message);
    }

    public function restart(Camera $camera)
    {
        // Simulate camera restart
        $camera->update([
            'last_restart' => now(),
            'status' => 'maintenance',
        ]);

        // In a real implementation, you would send a restart command to the camera
        // For now, we'll simulate it by updating the status back to active after a delay
        
        return back()->with('success', 'Camera restart initiated.');
    }

    private function pingCamera($ip, $port)
    {
        // Simple connection test - in reality you'd use proper camera API
        $connection = @fsockopen($ip, $port, $errno, $errstr, 5);
        
        if ($connection) {
            fclose($connection);
            return true;
        }
        
        return false;
    }
}