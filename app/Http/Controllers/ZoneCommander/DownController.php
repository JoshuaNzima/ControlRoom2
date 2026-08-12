<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Down;
use App\Models\Guards\ClientSite;
use Illuminate\Support\Facades\Gate;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardAssignment;
use Illuminate\Validation\Rule;

class DownController extends Controller
{
	public function index()
	{
		$user = Auth::user();
		if (!$user->zone_id) {
			return redirect()->route('dashboard')->with('error', 'No zone assigned to your account. Please contact an administrator.');
		}

		$downs = Down::query()
			->with([
				'clientSite:id,name,zone_id,client_id',
				'clientSite.client:id,name',
				'guardRelation:id,name,employee_id',
			])
			->whereHas('clientSite', fn ($q) => $q->where('zone_id', $user->zone_id))
			->latest()
			->limit(100)
			->get()
			->map(function (Down $down) {
				$siteName = (string) (optional($down->clientSite)->name ?? '');
				$clientName = (string) (optional(optional($down->clientSite)->client)->name ?? '');
				$guard = $down->guardRelation;

				return [
					'id' => $down->id,
					'type' => $down->type,
					'status' => $down->status,
					'title' => (string) ($down->title ?? ''),
					'description' => (string) ($down->description ?? ''),
					'escalation_level' => (int) ($down->escalation_level ?? 0),
					'created_at' => $down->created_at,
					'client_site_id' => $down->client_site_id,
					'guard_id' => $down->guard_id,
					'client_site' => $down->client_site_id ? [
						'id' => (int) $down->client_site_id,
						'name' => $siteName,
						'client_name' => $clientName,
					] : null,
					'guard' => $guard ? [
						'id' => (int) $guard->id,
						'name' => (string) ($guard->name ?? ''),
						'employee_id' => (string) ($guard->employee_id ?? ''),
					] : null,
				];
			});

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
				->where('status', 'active')
				->orderBy('name')
				->get(['id', 'name', 'employee_id']);

		$guardsPayload = $guards->map(function ($guard) use ($siteIdByGuard, $siteById) {
			$siteId = (int) ($siteIdByGuard[$guard->id] ?? 0);
			$site = $siteId ? $siteById->get($siteId) : null;
			$clientName = (string) (optional($site?->client)->name ?? '');
			$siteName = (string) (optional($site)->name ?? '');

			return [
				'id' => (int) $guard->id,
				'name' => (string) ($guard->name ?? ''),
				'employee_id' => (string) ($guard->employee_id ?? ''),
				'site_id' => $siteId ?: null,
				'site_name' => $siteName,
				'client_name' => $clientName,
			];
		});

		return Inertia::render('Downs/Index', [
			'downs' => $downs->values(),
			'guards' => $guardsPayload->values(),
			'mode' => 'zone-commander',
		]);
	}

	public function store(Request $request)
	{
		$this->authorize('create', Down::class);
		$validated = $request->validate([
			'client_site_id' => ['required','integer','exists:client_sites,id'],
			'type' => ['required', Rule::in(['guard_absent', 'site_unmanned', 'other'])],
			'guard_id' => ['nullable','integer','exists:guards,id', 'required_if:type,guard_absent'],
			'title' => ['nullable','string','max:150'],
			'description' => ['nullable','string','max:1000'],
		]);

		$user = Auth::user();
		$site = ClientSite::with('client')->findOrFail($validated['client_site_id']);
		if ((int)$site->zone_id !== (int)$user->zone_id) {
			abort(403, 'Site not in your zone');
		}

		$title = (string) ($validated['title'] ?? '');
		if ($title === '') {
			if (($validated['type'] ?? null) === 'guard_absent' && !empty($validated['guard_id'])) {
				$g = Guard::find($validated['guard_id']);
				$title = $g ? ('Guard absent: ' . (string) ($g->name ?? '')) : 'Guard absent';
			} elseif (($validated['type'] ?? null) === 'site_unmanned') {
				$title = 'Site unmanned';
			} else {
				$title = 'Down report';
			}
		}

		Down::create([
			'client_id' => $site->client_id,
			'client_site_id' => $site->id,
			'reported_by' => $user->id,
			'guard_id' => $validated['guard_id'] ?? null,
			'type' => $validated['type'],
			'title' => $title,
			'description' => $validated['description'] ?? null,
			'status' => 'open',
			'escalation_level' => 0,
		]);

		return back()->withSuccess('Down reported');
	}

	public function escalate($down)
	{
		$record = Down::findOrFail($down);
		$this->authorize('escalate', $record);
		$record->increment('escalation_level');
		$record->status = 'escalated';
		$record->save();
		return back()->withSuccess('Down escalated');
	}

	public function resolve($down)
	{
		$record = Down::findOrFail($down);
		$this->authorize('resolve', $record);
		$record->status = 'resolved';
		$record->resolved_at = now();
		$record->resolved_by = Auth::id();
		$record->save();
		return back()->withSuccess('Down resolved');
	}
}
