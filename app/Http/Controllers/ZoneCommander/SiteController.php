<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Guards\ClientSite;
use App\Models\Guards\GuardAssignment;
use App\Models\Guards\Attendance;
use App\Models\Guards\CheckpointScan;

class SiteController extends Controller
{
	public function index()
	{
		$user = Auth::user();
		if (!$user->zone_id) {
			return redirect()->route('dashboard')->with('error', 'No zone assigned to your account. Please contact an administrator.');
		}

		$sites = ClientSite::query()
			->where('zone_id', $user->zone_id)
			->with(['client:id,name'])
			->orderBy('name')
			->get([
				'id',
				'client_id',
				'name',
				'address',
				'contact_person',
				'phone',
				'status',
				'latitude',
				'longitude',
			]);

		$siteIds = $sites->pluck('id')->filter()->values();

		$guardCounts = $siteIds->isEmpty()
			? collect()
			: GuardAssignment::query()
				->select('client_site_id', DB::raw('COUNT(DISTINCT guard_id) as guard_count'))
				->whereIn('client_site_id', $siteIds)
				->active()
				->current()
				->groupBy('client_site_id')
				->pluck('guard_count', 'client_site_id');

		$presentCounts = $siteIds->isEmpty()
			? collect()
			: Attendance::query()
				->select('client_site_id', DB::raw('COUNT(DISTINCT guard_id) as present_count'))
				->whereIn('client_site_id', $siteIds)
				->whereDate('date', today())
				->whereNotNull('check_in_time')
				->groupBy('client_site_id')
				->pluck('present_count', 'client_site_id');

		$lastPatrolBySite = $siteIds->isEmpty()
			? collect()
			: CheckpointScan::query()
				->select('checkpoints.client_site_id', DB::raw('MAX(checkpoint_scans.scanned_at) as last_scanned_at'))
				->join('checkpoints', 'checkpoints.id', '=', 'checkpoint_scans.checkpoint_id')
				->whereIn('checkpoints.client_site_id', $siteIds)
				->groupBy('checkpoints.client_site_id')
				->pluck('last_scanned_at', 'checkpoints.client_site_id');

		$payload = $sites->map(function ($site) use ($guardCounts, $presentCounts, $lastPatrolBySite) {
			$rawStatus = (string) ($site->status ?? 'active');
			$status = in_array($rawStatus, ['active', 'inactive'], true) ? $rawStatus : 'active';
			$clientName = (string) (optional($site->client)->name ?? '');
			$last = $lastPatrolBySite->get($site->id);

			return [
				'id' => $site->id,
				'name' => $site->name,
				'client_name' => $clientName,
				'address' => (string) ($site->address ?? ''),
				'status' => $status,
				'guard_count' => (int) ($guardCounts->get($site->id) ?? 0),
				'attendance_today' => (int) ($presentCounts->get($site->id) ?? 0),
				'last_patrol' => $last ? (string) $last : null,
				'security_level' => 'medium',
				'coordinates' => [
					'lat' => (float) ($site->latitude ?? 0),
					'lng' => (float) ($site->longitude ?? 0),
				],
				'facilities' => [],
				'contact_person' => (string) ($site->contact_person ?? ''),
				'contact_phone' => (string) ($site->phone ?? ''),
			];
		});

		return Inertia::render('ZoneCommander/Sites', [
			'sites' => $payload,
		]);
	}

	public function sitesJson(Request $request)
	{
		$user = Auth::user();
		if (!$user->zone_id) {
			return response()->json([]);
		}

		$search = trim((string) $request->query('search', ''));

		$sites = ClientSite::query()
			->where('zone_id', $user->zone_id)
			->where('status', 'active')
			->with(['client:id,name'])
			->when($search !== '', function ($q) use ($search) {
				$q->where(function ($q2) use ($search) {
					$q2->where('name', 'like', "%{$search}%")
						->orWhereHas('client', fn ($qc) => $qc->where('name', 'like', "%{$search}%"));
				});
			})
			->orderBy('name')
			->limit(200)
			->get(['id', 'name', 'client_id']);

		return response()->json(
			$sites->map(fn ($s) => [
				'id' => $s->id,
				'name' => $s->name,
				'client_name' => (string) (optional($s->client)->name ?? ''),
			])->values()
		);
	}
}


