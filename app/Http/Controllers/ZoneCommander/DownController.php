<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Down;
use App\Models\Guards\ClientSite;
use Illuminate\Support\Facades\Gate;

class DownController extends Controller
{
	public function index()
	{
		return Inertia::render('ZoneCommander/Downs');
	}

	public function store(Request $request)
	{
		$this->authorize('create', Down::class);
		$validated = $request->validate([
			'client_site_id' => ['required','integer','exists:client_sites,id'],
			'type' => ['required','string','max:100'],
			'title' => ['required','string','max:150'],
			'description' => ['nullable','string','max:1000'],
		]);

		$user = Auth::user();
		$site = ClientSite::with('client')->findOrFail($validated['client_site_id']);
		if ((int)$site->zone_id !== (int)$user->zone_id) {
			abort(403, 'Site not in your zone');
		}

		Down::create([
			'client_id' => $site->client_id,
			'client_site_id' => $site->id,
			'reported_by' => $user->id,
			'type' => $validated['type'],
			'title' => $validated['title'],
			'description' => $validated['description'] ?? null,
			'status' => 'open',
			'escalation_level' => 0,
		]);

		return back()->with('success', 'Down reported');
	}

	public function escalate($down)
	{
		$record = Down::findOrFail($down);
		$this->authorize('escalate', $record);
		$record->increment('escalation_level');
		$record->status = 'escalated';
		$record->save();
		return back()->with('success', 'Down escalated');
	}

	public function resolve($down)
	{
		$record = Down::findOrFail($down);
		$this->authorize('resolve', $record);
		$record->status = 'resolved';
		$record->resolved_at = now();
		$record->resolved_by = Auth::id();
		$record->save();
		return back()->with('success', 'Down resolved');
	}
}


