<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Client;
use App\Models\Guards\ClientSite;
use App\Models\Guards\GuardAssignment;

class ClientsController extends Controller
{
	public function index()
	{
		$user = Auth::user();
		if (!$user->zone_id) {
			return redirect()->route('dashboard')->with('error', 'No zone assigned to your account. Please contact an administrator.');
		}

		$sites = ClientSite::query()
			->where('zone_id', $user->zone_id)
			->get(['id', 'client_id', 'status']);

		$clientIds = $sites->pluck('client_id')->filter()->unique()->values();
		$siteCounts = $sites->groupBy('client_id')->map(fn ($rows) => $rows->count());

		$guardCounts = $clientIds->isEmpty()
			? collect()
			: GuardAssignment::query()
				->select('client_sites.client_id', DB::raw('COUNT(DISTINCT guard_assignments.guard_id) as guard_count'))
				->join('client_sites', 'client_sites.id', '=', 'guard_assignments.client_site_id')
				->where('client_sites.zone_id', $user->zone_id)
				->active()
				->current()
				->groupBy('client_sites.client_id')
				->pluck('guard_count', 'client_sites.client_id');

		$clients = $clientIds->isEmpty()
			? collect()
			: Client::query()
				->whereIn('id', $clientIds)
				->orderBy('name')
				->get([
					'id',
					'name',
					'email',
					'phone',
					'status',
					'contract_start_date',
					'contract_end_date',
					'monthly_rate',
					'updated_at',
				]);

		$payload = $clients->map(function ($client) use ($siteCounts, $guardCounts) {
			$contractStart = $client->contract_start_date?->toDateString() ?: null;
			$contractEnd = $client->contract_end_date?->toDateString() ?: null;
			$lastContact = $client->updated_at?->toDateString() ?: now()->toDateString();

			return [
				'id' => $client->id,
				'name' => (string) ($client->name ?? ''),
				'email' => (string) ($client->email ?? ''),
				'phone' => (string) ($client->phone ?? ''),
				'status' => (string) ($client->status ?? 'active'),
				'contract_start' => $contractStart ?: $lastContact,
				'contract_end' => $contractEnd ?: $lastContact,
				'total_sites' => (int) ($siteCounts->get($client->id) ?? 0),
				'active_guards' => (int) ($guardCounts->get($client->id) ?? 0),
				'monthly_revenue' => (float) ($client->monthly_rate ?? 0),
				'last_contact' => $lastContact,
			];
		});

		return Inertia::render('ZoneCommander/Clients', [
			'clients' => $payload,
		]);
	}
}


