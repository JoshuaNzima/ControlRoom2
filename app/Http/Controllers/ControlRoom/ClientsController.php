<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Client;
use App\Models\Guards\ClientSite;
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
			->when(request('status'), function($q, $status){
				$q->where('status', $status);
			})
			->orderBy('name')
			->paginate(20);

		return Inertia::render('ControlRoom/Clients/Index', [
			'clients' => $clients,
			'filters' => request()->only(['search','status']),
		]);
	}

	public function show(Client $client)
	{
		$client->load(['sites' => function($q){ $q->select(['id','client_id','name','status']); }]);
		$guards = Guard::select(['id','name','status','position','is_leader'])->where('status','active')->orderBy('name')->get();
		$supervisors = User::role('supervisor')->select(['id','name'])->orderBy('name')->get();
		$sergeants = Guard::select(['id','name','position','is_leader'])
			->where('status','active')
			->where(function($q) {
				$q->where('position', 'sergeant')->orWhere('is_leader', true);
			})
			->orderBy('name')
			->get();

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
			'sergeants' => $sergeants,
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

	public function assignSergeant(Request $request, Client $client)
	{
		$data = $request->validate([
			'sergeant_id' => ['required', 'exists:guards,id'],
		]);

		// Validate the guard is actually a sergeant
		$sergeant = Guard::findOrFail($data['sergeant_id']);
		if (!$sergeant->isLeader() && $sergeant->position !== 'sergeant') {
			return response()->json(['success' => false, 'message' => 'Selected guard is not a sergeant.'], 422);
		}

		$client->sergeant_id = $data['sergeant_id'];
		$client->save();

		if ($request->wantsJson() || $request->ajax()) {
			return response()->json(['success' => true, 'message' => 'Sergeant assigned successfully.']);
		}

		return back()->with('success', 'Sergeant assigned to client');
	}

	public function unassignSergeant(Request $request, Client $client)
	{
		$client->sergeant_id = null;
		$client->save();

		if ($request->wantsJson() || $request->ajax()) {
			return response()->json(['success' => true, 'message' => 'Sergeant unassigned successfully.']);
		}

		return back()->with('success', 'Sergeant unassigned from client');
	}

	public function sitesJson(Request $request)
	{
		$search = trim((string) $request->input('search', ''));
		$zoneId = $request->input('zone_id');

		$sites = \App\Models\Guards\ClientSite::query()
			->with(['client' => function ($q) { $q->select('id', 'name'); }])
			->where('status', 'active')
			->when($zoneId, function ($q) use ($zoneId) {
				$q->where('zone_id', $zoneId);
			})
			->when($search, function ($q) use ($search) {
				$q->where(function ($qq) use ($search) {
					$qq->where('name', 'like', "%{$search}%")
					   ->orWhereHas('client', function ($qc) use ($search) {
						   $qc->where('name', 'like', "%{$search}%");
					   });
				});
			})
			->orderBy('name')
			->limit(50)
			->get(['id', 'client_id', 'name', 'status']);

		$payload = $sites->map(function ($site) {
			return [
				'id' => $site->id,
				'name' => $site->name,
				'client_name' => optional($site->client)->name,
			];
		});

		return response()->json($payload);
	}

	public function siteQr(ClientSite $site)
	{
		$site->load(['client:id,name']);

		// Ensure site has a QR code (generate if missing)
		if (!$site->qr_code) {
			$site->qr_code = ClientSite::generateUniqueQrCode();
			\DB::table('client_sites')->where('id', $site->id)->update(['qr_code' => $site->qr_code]);
		}

		$payload = [
			'issuer' => 'CoinSecurity',
			'type' => 'site',
			'site_id' => $site->id,
			'code' => $site->qr_code,
			'site_name' => $site->name,
			'client' => optional($site->client)->name,
			'lat' => $site->latitude !== null ? (float) $site->latitude : null,
			'lng' => $site->longitude !== null ? (float) $site->longitude : null,
			'ver' => 'v2',
		];

		$url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode(json_encode($payload));
		$png = @file_get_contents($url);
		if ($png === false) {
			return response('QR generation failed', 502);
		}

		return response($png, 200, ['Content-Type' => 'image/png']);
	}
}
