<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssignmentsController extends Controller
{
	public function index()
	{
		$filter = request('filter');

		$query = Guard::with(['supervisor', 'assignments.clientSite.client'])
			->orderBy('name');

		if ($filter === 'unassigned') {
			$query->whereDoesntHave('assignments', function ($qa) {
				$qa->whereNull('end_date')->where('is_active', true);
			});
		} elseif ($filter === 'assigned') {
			$query->whereHas('assignments', function ($qa) {
				$qa->whereNull('end_date')->where('is_active', true);
			});
		}

		$guards = $query
			->paginate(20)
			->withQueryString()
			->through(function ($g) {
				$current = $g->currentAssignment();
				return [
					'id' => $g->id,
					'name' => $g->name,
					'employee_id' => $g->employee_id,
					'status' => $g->status,
					'supervisor' => $g->supervisor ? ['id' => $g->supervisor->id, 'name' => $g->supervisor->name] : null,
					'current_assignment' => $current ? [
						'id' => $current->id,
						'client_name' => optional(optional($current)->clientSite)->client->name ?? null,
						'site_name' => optional($current->clientSite)->name ?? null,
					] : null,
				];
			});

		return Inertia::render('ControlRoom/Assignments/Index', [
			'guards' => $guards,
			'filters' => request()->only('filter'),
		]);
	}
}
