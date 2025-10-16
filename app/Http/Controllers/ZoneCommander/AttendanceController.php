<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Guards\Attendance;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;

class AttendanceController extends Controller
{
	public function index()
	{
		return Inertia::render('ZoneCommander/Attendance');
	}

	public function checkIn(Request $request)
	{
		$validated = $request->validate([
			'guard_id' => ['required','integer','exists:guards,id'],
			'client_site_id' => ['required','integer','exists:client_sites,id'],
			'notes' => ['nullable','string','max:500'],
		]);

		$user = Auth::user();
		$site = ClientSite::findOrFail($validated['client_site_id']);
		if ((int)$site->zone_id !== (int)$user->zone_id) {
			abort(403, 'Site not in your zone');
		}

		$attendance = Attendance::firstOrCreate([
			'guard_id' => $validated['guard_id'],
			'client_site_id' => $validated['client_site_id'],
			'date' => today(),
		], [
			'supervisor_id' => $user->id,
			'check_in_time' => now(),
			'status' => 'present',
			'check_in_notes' => $validated['notes'] ?? null,
		]);

		if (!$attendance->wasRecentlyCreated && !$attendance->check_in_time) {
			$attendance->update([
				'supervisor_id' => $user->id,
				'check_in_time' => now(),
				'check_in_notes' => $validated['notes'] ?? null,
				'status' => 'present',
			]);
		}

		return back()->with('success', 'Attendance checked in');
	}

	public function checkOut(Request $request)
	{
		$validated = $request->validate([
			'guard_id' => ['required','integer','exists:guards,id'],
			'client_site_id' => ['required','integer','exists:client_sites,id'],
			'notes' => ['nullable','string','max:500'],
		]);

		$user = Auth::user();
		$attendance = Attendance::where('guard_id', $validated['guard_id'])
			->where('client_site_id', $validated['client_site_id'])
			->whereDate('date', today())
			->firstOrFail();

		$site = ClientSite::findOrFail($validated['client_site_id']);
		if ((int)$site->zone_id !== (int)$user->zone_id) {
			abort(403, 'Site not in your zone');
		}

		$attendance->update([
			'check_out_time' => now(),
			'check_out_notes' => $validated['notes'] ?? null,
		]);
		$attendance->calculateHours();

		return back()->with('success', 'Attendance checked out');
	}
}


