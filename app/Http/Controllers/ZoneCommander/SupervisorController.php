<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Guards\Guard;

class SupervisorController extends Controller
{
	public function index()
	{
		$user = Auth::user();
		if (!$user->zone_id) {
			return redirect()->route('dashboard')->with('error', 'No zone assigned to your account. Please contact an administrator.');
		}

		$supervisors = User::query()
			->role(['supervisor', 'sergeant'])
			->where('zone_id', $user->zone_id)
			->orderBy('name')
			->get(['id', 'name', 'employee_id', 'email', 'phone', 'status', 'zone_id', 'updated_at']);

		$ids = $supervisors->pluck('id')->filter()->values();
		$teamSizes = $ids->isEmpty()
			? collect()
			: Guard::query()
				->select('supervisor_id', DB::raw('COUNT(*) as total'))
				->whereIn('supervisor_id', $ids)
				->where('status', 'active')
				->groupBy('supervisor_id')
				->pluck('total', 'supervisor_id');

		$payload = $supervisors->map(function ($sup) use ($teamSizes) {
			return [
				'id' => $sup->id,
				'name' => (string) ($sup->name ?? ''),
				'employee_id' => (string) ($sup->employee_id ?? ''),
				'email' => (string) ($sup->email ?? ''),
				'phone' => (string) ($sup->phone ?? ''),
				'status' => (string) ($sup->status ?? 'active'),
				'position' => $sup->getRoleNames()->first() ?? 'Supervisor',
				'zone_name' => '',
				'team_size' => (int) ($teamSizes->get($sup->id) ?? 0),
				'performance_score' => 0,
				'last_active' => $sup->updated_at?->toIso8601String() ?: now()->toIso8601String(),
				'certifications' => [],
				'emergency_contact' => '',
				'hire_date' => now()->toDateString(),
				'shift' => 'day',
			];
		});

		return Inertia::render('ZoneCommander/Supervisors', [
			'supervisors' => $payload,
		]);
	}
}


