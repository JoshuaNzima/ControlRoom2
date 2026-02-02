<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Guards\Checkpoint;
use App\Models\Guards\CheckpointScan;

class PatrolController extends Controller
{
	public function index()
	{
		$user = Auth::user();
		if (!$user->zone_id) {
			return redirect()->route('dashboard')->with('error', 'No zone assigned to your account. Please contact an administrator.');
		}

		$scans = CheckpointScan::query()
			->with([
				'supervisor:id,name',
				'checkpoint:id,client_site_id,name',
				'checkpoint.clientSite:id,name,client_id,zone_id',
				'checkpoint.clientSite.client:id,name',
			])
			->whereHas('checkpoint.clientSite', fn ($q) => $q->where('zone_id', $user->zone_id))
			->orderByDesc('scanned_at')
			->limit(50)
			->get();

		$patrols = $scans->map(function ($scan) {
			$checkpoint = $scan->checkpoint;
			$site = $checkpoint?->clientSite;
			$clientName = (string) (optional($site?->client)->name ?? '');
			$siteName = (string) (optional($site)->name ?? '');
			$checkpointName = (string) (optional($checkpoint)->name ?? 'Checkpoint');
			$lat = $scan->latitude;
			$lng = $scan->longitude;
			$location = (bool) $scan->location_verified
				? 'Verified'
				: 'Unverified';
			if ($lat !== null && $lng !== null) {
				$location .= " ({$lat}, {$lng})";
			}

			return [
				'id' => $scan->id,
				'guard_name' => (string) (optional($scan->supervisor)->name ?? 'Unknown'),
				'site_name' => trim($clientName ? ($clientName . ' • ' . $siteName) : $siteName),
				'checkpoint_name' => $checkpointName,
				'status' => 'completed',
				'scan_time' => optional($scan->scanned_at)->toIso8601String(),
				'location' => $location,
				'notes' => (string) ($scan->notes ?? ''),
				'photos' => [],
			];
		});

		return Inertia::render('ZoneCommander/Patrols', [
			'patrols' => $patrols,
		]);
	}

	public function startPatrol()
	{
		return redirect()->route('zone.patrols.index');
	}

	public function scan(Request $request)
	{
		$validated = $request->validate([
			'code' => ['required','string'], // checkpoint code encoded in QR
			'latitude' => ['nullable','numeric'],
			'longitude' => ['nullable','numeric'],
			'notes' => ['nullable','string','max:500'],
			'device_info' => ['nullable','string','max:255'],
		]);

		$user = Auth::user();
		$checkpoint = Checkpoint::where('code', $validated['code'])
			->with('clientSite')
			->firstOrFail();

		// Ensure checkpoint belongs to user's zone
		if ((int)optional($checkpoint->clientSite)->zone_id !== (int)$user->zone_id) {
			abort(403, 'Checkpoint not in your zone');
		}

		$locationVerified = false;
		if (isset($validated['latitude'], $validated['longitude'])) {
			$locationVerified = $checkpoint->verifyLocation($validated['latitude'], $validated['longitude']);
		}

		CheckpointScan::create([
			'checkpoint_id' => $checkpoint->id,
			'supervisor_id' => $user->id, // zone commander acting as supervisor for patrols
			'scanned_at' => now(),
			'latitude' => $validated['latitude'] ?? null,
			'longitude' => $validated['longitude'] ?? null,
			'device_info' => $validated['device_info'] ?? null,
			'location_verified' => $locationVerified,
			'notes' => $validated['notes'] ?? null,
		]);

		return back()->with('success', 'Scan recorded');
	}
}


