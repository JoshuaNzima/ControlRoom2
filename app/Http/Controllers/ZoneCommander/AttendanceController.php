<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Guards\Attendance;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use App\Models\Guards\GuardAssignment;

class AttendanceController extends Controller
{
	public function index()
	{
		$user = Auth::user();
		if (!$user->zone_id) {
			return redirect()->route('dashboard')->with('error', 'No zone assigned to your account. Please contact an administrator.');
		}

		$sites = ClientSite::query()
			->where('zone_id', $user->zone_id)
			->where('status', 'active')
			->with(['client:id,name'])
			->orderBy('name')
			->get(['id', 'name', 'client_id']);

		$sitePayload = $sites->map(function ($site) {
			$clientName = (string) (optional($site->client)->name ?? '');
			$fullName = trim($clientName ? ($clientName . ' • ' . $site->name) : $site->name);
			return [
				'id' => $site->id,
				'name' => $site->name,
				'client_name' => $clientName,
				'full_name' => $fullName,
			];
		});

		$assignmentRows = GuardAssignment::query()
			->select(['guard_id', 'client_site_id'])
			->whereHas('clientSite', fn ($q) => $q->where('zone_id', $user->zone_id))
			->active()
			->current()
			->get();

		$guardIds = $assignmentRows->pluck('guard_id')->filter()->unique()->values();
		$primarySiteByGuard = $assignmentRows
			->groupBy('guard_id')
			->map(fn ($rows) => (int) optional($rows->first())->client_site_id)
			->all();

		$guards = $guardIds->isEmpty()
			? collect()
			: Guard::query()
				->whereIn('id', $guardIds)
				->where('status', 'active')
				->orderBy('name')
				->get(['id', 'name', 'employee_id', 'phone', 'zone_id']);

		$attendanceByGuard = $guardIds->isEmpty()
			? collect()
			: Attendance::query()
				->whereDate('date', today())
				->whereIn('guard_id', $guardIds)
				->get()
				->keyBy('guard_id');

		$guardsPayload = $guards->map(function ($guard) use ($attendanceByGuard, $primarySiteByGuard) {
			$attendance = $attendanceByGuard->get($guard->id);
			$inPhoto = $attendance?->check_in_photo;
			$outPhoto = $attendance?->check_out_photo;

			return [
				'id' => $guard->id,
				'name' => $guard->name,
				'employee_id' => $guard->employee_id,
				'phone' => $guard->phone,
				'default_site_id' => (int) ($primarySiteByGuard[$guard->id] ?? 0) ?: null,
				'attendance' => $attendance ? [
					'id' => $attendance->id,
					'client_site_id' => $attendance->client_site_id,
					'status' => $attendance->status,
					'check_in_time' => $attendance->getRawOriginal('check_in_time') ?: null,
					'check_out_time' => $attendance->getRawOriginal('check_out_time') ?: null,
					'check_in_photo_url' => $inPhoto ? asset('storage/' . ltrim($inPhoto, '/')) : null,
					'check_out_photo_url' => $outPhoto ? asset('storage/' . ltrim($outPhoto, '/')) : null,
				] : null,
			];
		});

		return Inertia::render('ZoneCommander/Attendance', [
			'sites' => $sitePayload->values(),
			'guards' => $guardsPayload->values(),
		]);
	}

	public function checkIn(Request $request)
	{
		$validated = $request->validate([
			'guard_id' => ['required','integer','exists:guards,id'],
			'client_site_id' => ['required','integer','exists:client_sites,id'],
			'notes' => ['nullable','string','max:500'],
			'time' => ['nullable','date_format:H:i'],
			'photo' => ['required','image','max:5120'],
		]);

		$user = Auth::user();
		$site = ClientSite::findOrFail($validated['client_site_id']);
		if ((int)$site->zone_id !== (int)$user->zone_id) {
			abort(403, 'Site not in your zone');
		}

		$guard = Guard::findOrFail($validated['guard_id']);
		$guardZoneId = (int) ($guard->zone_id ?? 0);
		if ($guardZoneId && (int) $user->zone_id !== $guardZoneId) {
			abort(403, 'Guard not in your zone');
		}
		if (!$guardZoneId) {
			$hasZoneAssignment = GuardAssignment::query()
				->where('guard_id', $guard->id)
				->active()
				->current()
				->whereHas('clientSite', fn ($q) => $q->where('zone_id', $user->zone_id))
				->exists();
			if (!$hasZoneAssignment) {
				abort(403, 'Guard not assigned within your zone');
			}
		}

		$checkInTime = $validated['time']
			? \Carbon\Carbon::parse(today()->toDateString() . ' ' . $validated['time'])
			: now();

		$path = $request->file('photo')->store('attendance/'.now()->format('Y-m-d'), 'public');

		$attendance = Attendance::query()
			->where('guard_id', $validated['guard_id'])
			->whereDate('date', today())
			->first();
		if ($attendance && $attendance->check_in_time) {
			return back()->withErrors(['message' => 'Guard has already checked in today']);
		}
		$attendance = $attendance ?: new Attendance([
			'guard_id' => $validated['guard_id'],
			'date' => today(),
		]);

		$attendance->supervisor_id = $user->id;
		$attendance->client_site_id = $validated['client_site_id'];
		$attendance->check_in_time = $checkInTime;
		$attendance->check_in_notes = $validated['notes'] ?? null;
		$attendance->check_in_photo = $path;
		$attendance->status = 'present';
		$attendance->backdated = false;
		$attendance->backdated_reason = null;
		$attendance->source = 'zone_commander_manual';
		$attendance->save();

		return back()->with('success', 'Attendance checked in');
	}

	public function checkOut(Request $request)
	{
		$validated = $request->validate([
			'guard_id' => ['required','integer','exists:guards,id'],
			'client_site_id' => ['required','integer','exists:client_sites,id'],
			'notes' => ['nullable','string','max:500'],
			'time' => ['nullable','date_format:H:i'],
			'photo' => ['required','image','max:5120'],
		]);

		$user = Auth::user();
		$attendance = Attendance::where('guard_id', $validated['guard_id'])
			->whereDate('date', today())
			->first();
		if (!$attendance || !$attendance->check_in_time) {
			return back()->withErrors(['message' => 'No active check-in found for this guard']);
		}
		if ($attendance->check_out_time) {
			return back()->withErrors(['message' => 'Guard has already checked out today']);
		}

		$guard = Guard::findOrFail($validated['guard_id']);
		$guardZoneId = (int) ($guard->zone_id ?? 0);
		if ($guardZoneId && (int) $user->zone_id !== $guardZoneId) {
			abort(403, 'Guard not in your zone');
		}
		if (!$guardZoneId) {
			$hasZoneAssignment = GuardAssignment::query()
				->where('guard_id', $guard->id)
				->active()
				->current()
				->whereHas('clientSite', fn ($q) => $q->where('zone_id', $user->zone_id))
				->exists();
			if (!$hasZoneAssignment) {
				abort(403, 'Guard not assigned within your zone');
			}
		}

		$site = ClientSite::findOrFail($validated['client_site_id']);
		if ((int)$site->zone_id !== (int)$user->zone_id) {
			abort(403, 'Site not in your zone');
		}

		$checkOutTime = $validated['time']
			? \Carbon\Carbon::parse(today()->toDateString() . ' ' . $validated['time'])
			: now();
		$path = $request->file('photo')->store('attendance/'.now()->format('Y-m-d'), 'public');

		$attendance->update([
			'check_out_time' => $checkOutTime,
			'check_out_notes' => $validated['notes'] ?? null,
			'check_out_photo' => $path,
			'source' => $attendance->source ?: 'zone_commander_manual',
		]);
		$attendance->calculateHours();

		return back()->with('success', 'Attendance checked out');
	}
}


