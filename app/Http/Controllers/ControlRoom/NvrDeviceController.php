<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\NvrDevice;
use App\Models\Camera;
use App\Models\ClientSite;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class NvrDeviceController extends Controller
{
    public function index(Request $request)
    {
        $query = NvrDevice::query()->with([
            'site' => function ($q) {
                $q->select(['id', 'name', 'client_id'])
                    ->with('client:id,name');
            },
            'cameras' => function ($q) {
                $q->select(['id', 'nvr_device_id', 'status']);
            },
        ]);

        $clientId = $request->query('client_id');
        if (! empty($clientId)) {
            $query->whereHas('site', function ($q) use ($clientId) {
                $q->where('client_id', $clientId);
            });
        }

        $siteId = $request->query('site_id');
        if (! empty($siteId)) {
            $query->where('client_site_id', $siteId);
        }

        $status = $request->query('status');
        if (! empty($status)) {
            $query->where('status', $status);
        }

        $nvrs = $query->latest()->paginate(20)->withQueryString();

        $sites = ClientSite::query()
            ->select(['id', 'name', 'client_id'])
            ->with('client:id,name')
            ->orderBy('name')
            ->get();

        return Inertia::render('ControlRoom/Cameras/NvrDevices', [
            'nvrs' => $nvrs,
            'sites' => $sites,
            'filters' => [
                'device_types' => ['nvr', 'dvr'],
                'statuses' => ['online', 'offline', 'error', 'disabled'],
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
            'client_site_id' => 'nullable|exists:client_sites,id',
            'device_type' => 'required|in:nvr,dvr',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'public_protocol' => 'nullable|in:http,https,rtsp,rtsps',
            'public_host' => 'required|string|max:255',
            'public_port' => 'nullable|integer|min:1|max:65535',
            'public_path' => 'nullable|string|max:1024',
            'local_ip' => 'nullable|ip',
            'local_port' => 'nullable|integer|min:1|max:65535',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'api_key' => 'nullable|string|max:255',
            'channel_count' => 'nullable|integer|min:1|max:256',
            'notes' => 'nullable|string',
            'settings' => 'nullable|array',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['status'] = 'offline';

        $nvr = NvrDevice::create($validated);

        return redirect()->route('control-room.cameras.nvrs.index')
            ->withSuccess('NVR/DVR added successfully. Test connection and import cameras.');
    }

    public function show(NvrDevice $nvr)
    {
        $nvr->load([
            'site.client',
            'cameras' => function ($q) {
                $q->orderBy('nvr_channel');
            },
        ]);

        return Inertia::render('ControlRoom/Cameras/NvrShow', [
            'nvr' => $nvr,
        ]);
    }

    public function update(Request $request, NvrDevice $nvr)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client_site_id' => 'nullable|exists:client_sites,id',
            'device_type' => 'required|in:nvr,dvr',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'public_protocol' => 'nullable|in:http,https,rtsp,rtsps',
            'public_host' => 'required|string|max:255',
            'public_port' => 'nullable|integer|min:1|max:65535',
            'public_path' => 'nullable|string|max:1024',
            'local_ip' => 'nullable|ip',
            'local_port' => 'nullable|integer|min:1|max:65535',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'api_key' => 'nullable|string|max:255',
            'channel_count' => 'nullable|integer|min:1|max:256',
            'notes' => 'nullable|string',
            'settings' => 'nullable|array',
            'status' => 'in:online,offline,error,disabled',
        ]);

        $nvr->update($validated);

        return back()->withSuccess('NVR/DVR updated successfully.');
    }

    public function destroy(NvrDevice $nvr)
    {
        $cameraCount = $nvr->cameras()->count();

        if ($cameraCount > 0) {
            return back()->withError("Cannot delete NVR with {$cameraCount} cameras. Delete or reassign cameras first.");
        }

        $nvr->delete();

        return redirect()->route('control-room.cameras.nvrs.index')
            ->withSuccess('NVR/DVR deleted successfully.');
    }

    public function testConnection(NvrDevice $nvr)
    {
        $host = $nvr->public_host;
        $port = $nvr->public_port ?: 80;

        $isConnected = $this->pingDevice($host, $port);

        $nvr->update([
            'status' => $isConnected ? 'online' : 'offline',
            'last_online_at' => $isConnected ? now() : $nvr->last_online_at,
        ]);

        if ($isConnected) {
            return back()->withSuccess('NVR/DVR connection successful.');
        }

        return back()->withError('NVR/DVR connection failed. Check host, port, and port forwarding.');
    }

    public function importCameras(Request $request, NvrDevice $nvr)
    {
        $validated = $request->validate([
            'channels' => 'nullable|array',
            'channels.*' => 'integer|min:1|max:256',
            'camera_type' => 'nullable|in:fixed,dome,ptz,thermal',
            'default_location' => 'nullable|string|max:255',
        ]);

        $channels = $validated['channels'] ?? range(1, $nvr->channel_count ?: 16);
        $cameraType = $validated['camera_type'] ?? 'fixed';
        $defaultLocation = $validated['default_location'] ?? ($nvr->site?->name ?? 'Unknown');

        $imported = 0;
        $existing = 0;

        foreach ($channels as $channel) {
            $exists = Camera::where('nvr_device_id', $nvr->id)
                ->where('nvr_channel', $channel)
                ->exists();

            if ($exists) {
                $existing++;
                continue;
            }

            $streamUrl = $nvr->buildChannelStreamUrl($channel, 'hls');

            Camera::create([
                'name' => "{$nvr->name} - Camera {$channel}",
                'client_site_id' => $nvr->client_site_id,
                'source_type' => $nvr->device_type,
                'nvr_device_id' => $nvr->id,
                'nvr_channel' => $channel,
                'stream_url' => $streamUrl,
                'stream_type' => 'hls',
                'type' => $cameraType,
                'location' => "Channel {$channel} - {$defaultLocation}",
                'status' => 'offline',
                'username' => $nvr->username,
                'password' => $nvr->password,
                'public_protocol' => $nvr->public_protocol,
                'public_host' => $nvr->public_host,
                'public_port' => $nvr->public_port,
                'created_by' => auth()->id(),
            ]);

            $imported++;
        }

        $nvr->update([
            'active_channels' => $nvr->cameras()->count(),
            'last_sync_at' => now(),
        ]);

        $message = "Imported {$imported} cameras. {$existing} already existed.";

        return back()->withSuccess($message);
    }

    public function syncAllChannels(Request $request, NvrDevice $nvr)
    {
        $channelCount = $nvr->channel_count ?: 16;
        $imported = 0;
        $updated = 0;

        for ($channel = 1; $channel <= $channelCount; $channel++) {
            $camera = Camera::where('nvr_device_id', $nvr->id)
                ->where('nvr_channel', $channel)
                ->first();

            $streamUrl = $nvr->buildChannelStreamUrl($channel, 'hls');

            if ($camera) {
                $camera->update([
                    'stream_url' => $streamUrl,
                    'source_type' => $nvr->device_type,
                    'public_protocol' => $nvr->public_protocol,
                    'public_host' => $nvr->public_host,
                    'public_port' => $nvr->public_port,
                ]);
                $updated++;
            } else {
                Camera::create([
                    'name' => "{$nvr->name} - Camera {$channel}",
                    'client_site_id' => $nvr->client_site_id,
                    'source_type' => $nvr->device_type,
                    'nvr_device_id' => $nvr->id,
                    'nvr_channel' => $channel,
                    'stream_url' => $streamUrl,
                    'stream_type' => 'hls',
                    'type' => 'fixed',
                    'location' => "Channel {$channel} - " . ($nvr->site?->name ?? 'Unknown'),
                    'status' => 'offline',
                    'username' => $nvr->username,
                    'password' => $nvr->password,
                    'public_protocol' => $nvr->public_protocol,
                    'public_host' => $nvr->public_host,
                    'public_port' => $nvr->public_port,
                    'created_by' => auth()->id(),
                ]);
                $imported++;
            }
        }

        $nvr->update([
            'active_channels' => $nvr->cameras()->count(),
            'last_sync_at' => now(),
        ]);

        return back()->withSuccess("Sync complete: {$imported} added, {$updated} updated.");
    }

    public function getAvailableChannels(NvrDevice $nvr): JsonResponse
    {
        $existingChannels = $nvr->cameras()
            ->pluck('nvr_channel')
            ->toArray();

        $channelCount = $nvr->channel_count ?: 16;
        $availableChannels = [];

        for ($i = 1; $i <= $channelCount; $i++) {
            $availableChannels[] = [
                'channel' => $i,
                'exists' => in_array($i, $existingChannels),
            ];
        }

        return response()->json([
            'success' => true,
            'channels' => $availableChannels,
            'total' => $channelCount,
            'existing' => count($existingChannels),
        ]);
    }

    public function quickImport(Request $request, NvrDevice $nvr): JsonResponse
    {
        $validated = $request->validate([
            'channel_count' => 'required|integer|min:1|max:256',
            'camera_type' => 'nullable|in:fixed,dome,ptz,thermal',
        ]);

        $channelCount = $validated['channel_count'];
        $cameraType = $validated['camera_type'] ?? 'fixed';

        // Update channel count on NVR
        $nvr->update(['channel_count' => $channelCount]);

        $imported = 0;

        for ($channel = 1; $channel <= $channelCount; $channel++) {
            $exists = Camera::where('nvr_device_id', $nvr->id)
                ->where('nvr_channel', $channel)
                ->exists();

            if ($exists) {
                continue;
            }

            $streamUrl = $nvr->buildChannelStreamUrl($channel, 'hls');

            Camera::create([
                'name' => "{$nvr->name} - Camera {$channel}",
                'client_site_id' => $nvr->client_site_id,
                'source_type' => $nvr->device_type,
                'nvr_device_id' => $nvr->id,
                'nvr_channel' => $channel,
                'stream_url' => $streamUrl,
                'stream_type' => 'hls',
                'type' => $cameraType,
                'location' => "Channel {$channel} - " . ($nvr->site?->name ?? 'Unknown'),
                'status' => 'offline',
                'username' => $nvr->username,
                'password' => $nvr->password,
                'public_protocol' => $nvr->public_protocol,
                'public_host' => $nvr->public_host,
                'public_port' => $nvr->public_port,
                'created_by' => auth()->id(),
            ]);

            $imported++;
        }

        $nvr->update([
            'active_channels' => $nvr->cameras()->count(),
            'last_sync_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'imported' => $imported,
            'total_channels' => $channelCount,
            'message' => "Imported {$imported} cameras from NVR.",
        ]);
    }

    private function pingDevice(string $host, int $port): bool
    {
        $connection = @fsockopen($host, $port, $errno, $errstr, 5);

        if ($connection) {
            fclose($connection);
            return true;
        }

        return false;
    }
}
