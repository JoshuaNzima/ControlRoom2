<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Camera;
use App\Models\CameraRecording;
use App\Models\Client;
use App\Models\ClientSite;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class CameraController extends Controller
{
    public function index(Request $request)
    {
        $query = Camera::query()->with([
            'site' => function ($q) {
                $q->select(['id', 'name', 'client_id'])
                    ->with('client:id,name');
            },
            'alerts',
        ]);

        $clientId = $request->query('client_id');
        if (! empty($clientId)) {
            $query->whereHas('site', function ($q) use ($clientId) {
                $q->where('client_id', $clientId);
            });
        }

        $siteId = $request->query('site_id') ?? $request->query('client_site_id');
        if (! empty($siteId)) {
            $query->where('client_site_id', $siteId);
        }

        $status = $request->query('status');
        if (! empty($status)) {
            $query->where('status', $status);
        }

        $cameras = $query->latest()->paginate(20)->withQueryString();

        $sitesQuery = ClientSite::query()
            ->select(['id', 'name', 'client_id'])
            ->with('client:id,name')
            ->orderBy('name');

        if (! empty($clientId)) {
            $sitesQuery->where('client_id', $clientId);
        }

        $sites = $sitesQuery->get();

        $clients = Client::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();

        return Inertia::render('ControlRoom/Cameras/Index', [
            'cameras' => $cameras,
            'sites' => $sites,
            'clients' => $clients,
            'filters' => [
                'statuses' => ['online', 'offline', 'maintenance', 'disabled'],
            ],
            'appliedFilters' => [
                'client_id' => $clientId,
                'site_id' => $siteId,
                'status' => $status,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client_site_id' => 'required|exists:client_sites,id',
            'stream_url' => 'nullable|string|max:2048',
            'type' => 'required|in:ptz,fixed,dome,thermal',
            'location' => 'required|string|max:255',
            'status' => 'required|in:online,offline,maintenance,disabled',
            'ip_address' => 'nullable|string|max:255',
            'port' => 'nullable|integer|min:1|max:65535',
            'public_protocol' => 'nullable|in:http,https,rtsp,rtsps',
            'public_host' => 'nullable|string|max:255',
            'public_port' => 'nullable|integer|min:1|max:65535',
            'public_path' => 'nullable|string|max:1024',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'recording_enabled' => 'sometimes|boolean',
            'retention_days' => 'sometimes|integer|min:1|max:365',
            'motion_detection' => 'sometimes|boolean',
            'night_vision' => 'sometimes|boolean',
            'description' => 'nullable|string',
        ]);

        $validated['stream_url'] = $this->resolveStreamUrl($validated);

        if (empty($validated['stream_url'])) {
            return back()->withErrors([
                'stream_url' => 'Stream URL is required (or provide Public Protocol/Host/Port/Path to generate it).',
            ])->withInput();
        }

        $camera = Camera::create([
            ...$validated,
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('control-room.cameras.show', $camera)
            ->withSuccess('Camera added successfully.');
    }

    public function show(Camera $camera)
    {
        $camera->load(['site', 'alerts', 'recordings']);

        $recentRecordings = $camera->recordings()
            ->latest()
            ->limit(10)
            ->get();

        $activeAlerts = $camera->alerts()
            ->where('status', 'active')
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('ControlRoom/Cameras/Show', [
            'camera' => $camera,
            'recentRecordings' => $recentRecordings,
            'activeAlerts' => $activeAlerts,
        ]);
    }

    public function update(Request $request, Camera $camera)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client_site_id' => 'required|exists:client_sites,id',
            'stream_url' => 'nullable|string|max:2048',
            'type' => 'required|in:ptz,fixed,dome,thermal',
            'location' => 'required|string|max:255',
            'status' => 'required|in:online,offline,maintenance,disabled',
            'ip_address' => 'nullable|string|max:255',
            'port' => 'nullable|integer|min:1|max:65535',
            'public_protocol' => 'nullable|in:http,https,rtsp,rtsps',
            'public_host' => 'nullable|string|max:255',
            'public_port' => 'nullable|integer|min:1|max:65535',
            'public_path' => 'nullable|string|max:1024',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'recording_enabled' => 'sometimes|boolean',
            'retention_days' => 'sometimes|integer|min:1|max:365',
            'motion_detection' => 'sometimes|boolean',
            'night_vision' => 'sometimes|boolean',
            'description' => 'nullable|string',
        ]);

        $validated['stream_url'] = $this->resolveStreamUrl($validated);

        if (empty($validated['stream_url'])) {
            return back()->withErrors([
                'stream_url' => 'Stream URL is required (or provide Public Protocol/Host/Port/Path to generate it).',
            ])->withInput();
        }

        $camera->update($validated);

        return redirect()->route('control-room.cameras.show', $camera)
            ->withSuccess('Camera updated successfully.');
    }

    public function destroy(Camera $camera)
    {
        $camera->delete();

        return redirect()->route('control-room.cameras.index')
            ->withSuccess('Camera deleted successfully.');
    }

    public function getRecordings(Camera $camera): JsonResponse
    {
        $recordings = $camera->recordings()
            ->latest()
            ->paginate(20);

        return response()->json(['success' => true, 'recordings' => $recordings]);
    }

    public function downloadRecording(CameraRecording $recording)
    {
        if (!Storage::exists($recording->file_path)) {
            abort(404, 'Recording file not found.');
        }

        $filename = $recording->filename ?: basename($recording->file_path);

        return Storage::download($recording->file_path, $filename);
    }

    public function acknowledgeAlert(Request $request, Camera $camera, $alertId)
    {
        $alert = $camera->alerts()->findOrFail($alertId);
        
        $alert->update([
            'status' => 'acknowledged',
            'acknowledged_by' => auth()->id(),
            'acknowledged_at' => now(),
        ]);

        return back()->withSuccess('Alert acknowledged successfully.');
    }

    public function resolveAlert(Request $request, Camera $camera, $alertId)
    {
        $alert = $camera->alerts()->findOrFail($alertId);
        
        $alert->update([
            'status' => 'resolved',
            'resolved_by' => auth()->id(),
            'resolved_at' => now(),
        ]);

        return back()->withSuccess('Alert resolved successfully.');
    }

    public function testConnection(Camera $camera)
    {
        // Simulate connection test
        $host = $camera->public_host ?: $camera->ip_address;
        $port = $camera->public_port ?: $camera->port;

        if (empty($host) || empty($port)) {
            return back()->withError('Camera connection test requires a host and port.');
        }

        $isConnected = $this->pingCamera($host, $port);
        
        $camera->update([
            'last_connection_test' => now(),
            'connection_status' => $isConnected ? 'connected' : 'disconnected',
        ]);

        $message = $isConnected ? 'Camera connection successful.' : 'Camera connection failed.';
        return $isConnected ? back()->withSuccess($message) : back()->withError($message);
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
        
        return back()->withSuccess('Camera restart initiated.');
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

    private function resolveStreamUrl(array $validated): ?string
    {
        $direct = $validated['stream_url'] ?? null;
        if (is_string($direct) && trim($direct) !== '') {
            return trim($direct);
        }

        $protocol = $validated['public_protocol'] ?? null;
        $host = $validated['public_host'] ?? null;
        $port = $validated['public_port'] ?? null;
        $path = $validated['public_path'] ?? null;

        return $this->buildStreamUrl($protocol, $host, $port, $path);
    }

    private function buildStreamUrl(?string $protocol, ?string $host, $port, ?string $path): ?string
    {
        $host = is_string($host) ? trim($host) : '';
        if ($host === '') {
            return null;
        }

        $protocol = is_string($protocol) && trim($protocol) !== '' ? trim($protocol) : 'http';

        $portPart = '';
        if ($port !== null && $port !== '') {
            $portPart = ':' . $port;
        }

        $path = is_string($path) ? trim($path) : '';
        if ($path !== '' && ! str_starts_with($path, '/')) {
            $path = '/' . $path;
        }

        return $protocol . '://' . $host . $portPart . $path;
    }
}