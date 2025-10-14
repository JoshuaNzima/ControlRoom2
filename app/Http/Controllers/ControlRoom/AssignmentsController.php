<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\Guards\Assignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssignmentsController extends Controller
{
	public function index()
	{
		$guards = Guard::with(['supervisor', 'currentAssignment.clientSite.client'])
			->orderBy('name')
			->paginate(20)
			->through(function ($g) {
				return [
					'id' => $g->id,
					'name' => $g->name,
					'employee_id' => $g->employee_id,
					'status' => $g->status,
					'supervisor' => $g->supervisor ? ['id' => $g->supervisor->id, 'name' => $g->supervisor->name] : null,
					'current_assignment' => $g->currentAssignment ? [
						'client_name' => optional(optional($g->currentAssignment)->clientSite)->client->name ?? null,
						'site_name' => optional($g->currentAssignment->clientSite)->name ?? null,
					] : null,
				];
			});

		return Inertia::render('ControlRoom/Assignments/Index', [
			'guards' => $guards,
		]);
	}
}
