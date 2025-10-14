<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GuardsController extends Controller
{
	public function index()
	{
		$guards = Guard::with(['supervisor', 'todayAttendance'])
			->when(request('search'), function ($q, $search) {
				$q->where('name', 'like', "%{$search}%")
					->orWhere('employee_id', 'like', "%{$search}%");
			})
			->orderBy('name')
			->paginate(20)
			->through(function ($g) {
				return [
					'id' => $g->id,
					'name' => $g->name,
					'employee_id' => $g->employee_id,
					'status' => $g->status,
					'supervisor' => $g->supervisor ? ['id' => $g->supervisor->id, 'name' => $g->supervisor->name] : null,
					'today_attendance' => $g->todayAttendance?->first() ? [
						'check_in' => optional($g->todayAttendance->first()->check_in_time)->format('H:i'),
						'check_out' => optional($g->todayAttendance->first()->check_out_time)->format('H:i'),
					] : null,
				];
			});

		return Inertia::render('ControlRoom/Guards/Index', [
			'guards' => $guards,
			'filters' => request()->only(['search'])
		]);
	}
}
