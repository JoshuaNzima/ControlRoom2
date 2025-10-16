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
		return Inertia::render('ZoneCommander/Patrols');
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


