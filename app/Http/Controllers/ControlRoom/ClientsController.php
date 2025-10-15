<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Client;
use App\Models\Guards\Guard;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientsController extends Controller
{
	public function index()
	{
		$clients = Client::withCount('sites')
			->when(request('search'), function($q, $search) {
				$q->where('name', 'like', "%{$search}%");
			})
			->orderBy('name')
			->paginate(20);

		return Inertia::render('ControlRoom/Clients/Index', [
			'clients' => $clients,
			'filters' => request()->only(['search']),
		]);
	}

	public function show(Client $client)
	{
		$client->load(['sites' => function($q){ $q->select(['id','client_id','name','status']); }]);
		$guards = Guard::select(['id','name','status'])->where('status','active')->orderBy('name')->get();
		$supervisors = User::role('supervisor')->select(['id','name'])->orderBy('name')->get();

		$assignmentsBySite = \App\Models\Guards\GuardAssignment::with(['assignedGuard:id,name','clientSite:id,name'])
			->whereIn('client_site_id', $client->sites->pluck('id'))
			->where('is_active', true)
			->get()
			->groupBy('client_site_id')
			->map(function($group) {
				return $group->map(function($a){
					return [
						'id' => $a->id,
						'guard' => $a->assignedGuard?->only(['id','name']),
						'client_site_id' => $a->client_site_id,
					];
				});
			});

		return Inertia::render('ControlRoom/Clients/Show', [
			'client' => $client,
			'guards' => $guards,
			'supervisors' => $supervisors,
			'assignmentsBySite' => $assignmentsBySite,
		]);
	}

	public function assignGuard(Request $request, Client $client)
	{
		$data = $request->validate([
			'guard_id' => ['required','exists:guards,id'],
		]);

		// business rule: assign a guard to all client sites as active assignment (simplified)
		foreach ($client->sites as $site) {
			\App\Models\Guards\GuardAssignment::firstOrCreate([
				'guard_id' => $data['guard_id'],
				'client_site_id' => $site->id,
			], [
				'assigned_by' => $request->user()?->id,
				'start_date' => now()->startOfDay(),
				'is_active' => true,
			]);
		}

		return back()->with('success', 'Guard assigned to client');
	}

	public function assignSupervisor(Request $request, Client $client)
	{
		$data = $request->validate([
			'supervisor_id' => ['required','exists:users,id'],
		]);

		$client->supervisor_id = $data['supervisor_id'];
		$client->save();

		return back()->with('success', 'Supervisor assigned to client');
	}
}
