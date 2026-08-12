<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardAssignment;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Attendance;

class GuardController extends Controller
{
	public function index()
	{
		$user = Auth::user();
		if (!$user->zone_id) {
			return redirect()->route('dashboard')->with('error', 'No zone assigned to your account. Please contact an administrator.');
		}

		$assignmentRows = GuardAssignment::query()
			->select(['guard_id', 'client_site_id'])
			->whereHas('clientSite', fn ($q) => $q->where('zone_id', $user->zone_id))
			->active()
			->current()
			->get();

		$guardIds = $assignmentRows->pluck('guard_id')->filter()->unique()->values();
		$siteIdByGuard = $assignmentRows
			->groupBy('guard_id')
			->map(fn ($rows) => (int) optional($rows->first())->client_site_id)
			->all();

		$siteIds = $assignmentRows->pluck('client_site_id')->filter()->unique()->values();
		$sites = $siteIds->isEmpty()
			? collect()
			: ClientSite::query()
				->whereIn('id', $siteIds)
				->with(['client:id,name'])
				->get(['id', 'name', 'client_id']);
		$siteById = $sites->keyBy('id');

		$guards = $guardIds->isEmpty()
			? collect()
			: Guard::query()
				->whereIn('id', $guardIds)
				->orderBy('name')
				->get([
					'id',
					'name',
					'employee_id',
					'email',
					'phone',
					'status',
					'employee_role',
					'risk_level',
					'infraction_count',
					'emergency_contact_name',
					'emergency_contact_phone',
					'hire_date',
				]);

		$attendanceByGuard = $guardIds->isEmpty()
			? collect()
			: Attendance::query()
				->whereDate('date', today())
				->whereIn('guard_id', $guardIds)
				->get(['guard_id', 'check_in_time'])
				->keyBy('guard_id');

		$payload = $guards->map(function ($guard) use ($siteIdByGuard, $siteById, $attendanceByGuard) {
			$siteId = (int) ($siteIdByGuard[$guard->id] ?? 0);
			$site = $siteId ? $siteById->get($siteId) : null;
			$clientName = (string) (optional($site?->client)->name ?? '');
			$siteName = (string) (optional($site)->name ?? '');
			$att = $attendanceByGuard->get($guard->id);
			$checkIn = $att ? ($att->getRawOriginal('check_in_time') ?: null) : null;

			return [
				'id' => $guard->id,
				'name' => (string) ($guard->name ?? ''),
				'employee_id' => (string) ($guard->employee_id ?? ''),
				'email' => (string) ($guard->email ?? ''),
				'phone' => (string) ($guard->phone ?? ''),
				'status' => (string) ($guard->status ?? 'active'),
				'position' => (string) ($guard->employee_role ?? 'guard'),
				'site_id' => $siteId ?: null,
				'site_name' => $siteName,
				'client_name' => $clientName,
				'shift' => 'day',
				'performance_score' => 0,
				'attendance_rate' => 0,
				'last_check_in' => $checkIn ? (string) $checkIn : '',
				'risk_level' => (string) ($guard->risk_level ?? 'low'),
				'certifications' => [],
				'emergency_contact' => (string) ($guard->emergency_contact_name ?? ''),
				'emergency_phone' => (string) ($guard->emergency_contact_phone ?? ''),
				'hire_date' => $guard->hire_date?->toDateString() ?: now()->toDateString(),
			];
		});

		return Inertia::render('ZoneCommander/Guards', [
			'guards' => $payload,
		]);
	}

	public function assignToSite(Request $request)
	{
		$user = Auth::user();
		if (!$user->zone_id) {
			abort(403, 'No zone assigned');
		}

		$validated = $request->validate([
			'guard_id' => ['required', 'integer', 'exists:guards,id'],
			'client_site_id' => ['required', 'integer', 'exists:client_sites,id'],
		]);

		$site = ClientSite::findOrFail($validated['client_site_id']);
		if ((int) $site->zone_id !== (int) $user->zone_id) {
			abort(403, 'Site not in your zone');
		}

		// Only allow deploying guards that are already assigned somewhere in this zone
		$guardInZone = GuardAssignment::query()
			->where('guard_id', $validated['guard_id'])
			->active()
			->current()
			->whereHas('clientSite', fn ($q) => $q->where('zone_id', $user->zone_id))
			->exists();
		if (!$guardInZone) {
			abort(403, 'Guard not assigned within your zone');
		}

		$startDate = now()->toDateString();

		$alreadyAssigned = GuardAssignment::query()
			->where('guard_id', $validated['guard_id'])
			->where('client_site_id', $validated['client_site_id'])
			->whereNull('end_date')
			->where('is_active', true)
			->exists();
		if ($alreadyAssigned) {
			return back()->with('success', 'Guard already deployed to this site.');
		}

		$openAssignments = GuardAssignment::query()
			->where('guard_id', $validated['guard_id'])
			->whereNull('end_date')
			->where('is_active', true)
			->with(['clientSite:id,zone_id'])
			->get(['id', 'guard_id', 'client_site_id', 'is_active', 'end_date']);

		$outsideZone = $openAssignments->first(function ($a) use ($user) {
			return (int) (optional($a->clientSite)->zone_id ?? 0) !== (int) $user->zone_id;
		});
		if ($outsideZone) {
			abort(403, 'Guard has an active assignment outside your zone.');
		}

		GuardAssignment::query()
			->where('guard_id', $validated['guard_id'])
			->whereNull('end_date')
			->where('is_active', true)
			->whereHas('clientSite', fn ($q) => $q->where('zone_id', $user->zone_id))
			->update(['end_date' => $startDate, 'is_active' => false, 'active' => false]);

		GuardAssignment::create([
			'guard_id' => $validated['guard_id'],
			'client_site_id' => $validated['client_site_id'],
			'assigned_by' => $user->id,
			'start_date' => $startDate,
			'end_date' => null,
			'assignment_type' => 'permanent',
			'notes' => null,
			'is_active' => true,
			'active' => true,
		]);

		return back()->with('success', 'Guard deployed to site.');
	}

	public function unassignFromSite(Request $request)
	{
		$user = Auth::user();
		if (!$user->zone_id) {
			abort(403, 'No zone assigned');
		}

		$validated = $request->validate([
			'guard_id' => ['required', 'integer', 'exists:guards,id'],
		]);

		$assignment = GuardAssignment::query()
			->where('guard_id', $validated['guard_id'])
			->whereNull('end_date')
			->where('is_active', true)
			->whereHas('clientSite', fn ($q) => $q->where('zone_id', $user->zone_id))
			->first();

		if (!$assignment) {
			return back()->with('success', 'No active deployment found.');
		}

		$assignment->update([
			'end_date' => now()->toDateString(),
			'is_active' => false,
			'active' => false,
		]);

		return back()->with('success', 'Guard unassigned from site.');
	}
}


