<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Guards\Attendance;
use App\Models\Guards\CheckpointScan;
use App\Models\Incident;
use App\Models\Down;

class ReportController extends Controller
{
	public function index()
	{
		$user = Auth::user();

		$attendanceSummary = Attendance::whereHas('clientSite', function($q) use ($user) {
			$q->where('zone_id', $user->zone_id);
		})
			->thisMonth()
			->selectRaw('status, COUNT(*) as count')
			->groupBy('status')
			->pluck('count','status');

		$patrolsThisWeek = CheckpointScan::whereHas('checkpoint.clientSite', function($q) use ($user) {
			$q->where('zone_id', $user->zone_id);
		})
			->whereBetween('scanned_at', [now()->startOfWeek(), now()->endOfWeek()])
			->count();

		$downsOpen = Down::whereHas('clientSite', function($q) use ($user) {
			$q->where('zone_id', $user->zone_id);
		})
			->where('status', '!=', 'resolved')
			->count();

		return Inertia::render('ZoneCommander/Reports', [
			'attendanceSummary' => $attendanceSummary,
			'patrolsThisWeek' => $patrolsThisWeek,
			'downsOpen' => $downsOpen,
		]);
	}
}


