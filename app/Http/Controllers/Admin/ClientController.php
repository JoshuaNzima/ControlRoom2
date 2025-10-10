<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guards\{Client, ClientSite};
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientController extends Controller
{
    public function dashboard()
    {
        $totalClients = Client::count();
        $activeClients = Client::where('status', 'active')->count();
        $inactiveClients = Client::where('status', 'inactive')->count();
        $totalSites = ClientSite::count();
        $activeSites = ClientSite::where('status', 'active')->count();

        // Top clients by site count
        $topClients = Client::withCount('sites')
            ->orderByDesc('sites_count')
            ->limit(5)
            ->get(['id', 'name']);

        // Recent clients
        $recentClients = Client::latest()->limit(5)->get(['id', 'name', 'status']);

        return Inertia::render('Admin/Clients/Dashboard', [
            'kpis' => [
                'total_clients' => $totalClients,
                'active_clients' => $activeClients,
                'inactive_clients' => $inactiveClients,
                'total_sites' => $totalSites,
                'active_sites' => $activeSites,
            ],
            'topClients' => $topClients,
            'recentClients' => $recentClients,
        ]);
    }
    public function index()
    {
        $clients = Client::withCount('sites')
            ->when(request('search'), function($q, $search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('Admin/Clients/Index', [
            'clients' => $clients,
            'filters' => request()->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Clients/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'contract_start_date' => 'nullable|date',
            'contract_end_date' => 'nullable|date|after:contract_start_date',
            'monthly_rate' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            // Optional initial site
            'site.name' => 'nullable|string|max:255',
            'site.address' => 'nullable|string',
            'site.required_guards' => 'nullable|integer|min:1',
            'site.services_requested' => 'nullable|string',
            'site.status' => 'nullable|in:active,inactive',
            'site.contact_person' => 'nullable|string|max:255',
            'site.phone' => 'nullable|string|max:20',
            'site.special_instructions' => 'nullable|string',
            'site.latitude' => 'nullable|numeric',
            'site.longitude' => 'nullable|numeric',
        ]);

        $client = Client::create(collect($validated)->except(['site'])->toArray());

        if (!empty($validated['site']) && !empty($validated['site']['name'])) {
            $siteData = $validated['site'];
            // Ensure required defaults
            $siteData['status'] = $siteData['status'] ?? 'active';
            $siteData['required_guards'] = $siteData['required_guards'] ?? 1;
            $client->sites()->create($siteData);
        }

        return redirect()->route('clients.index')
            ->with('success', 'Client created successfully.');
    }

    public function show(Client $client)
    {
        $client->load('sites');

        return Inertia::render('Admin/Clients/Show', [
            'client' => $client,
        ]);
    }

    public function edit(Client $client)
    {
        return Inertia::render('Admin/Clients/Edit', [
            'client' => $client,
        ]);
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'contract_start_date' => 'nullable|date',
            'contract_end_date' => 'nullable|date|after:contract_start_date',
            'monthly_rate' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $client->update($validated);

        return redirect()->route('clients.index')
            ->with('success', 'Client updated successfully.');
    }

    public function destroy(Client $client)
    {
        $client->delete();

        return redirect()->route('clients.index')
            ->with('success', 'Client deleted successfully.');
    }

    // Site management
    public function createSite(Client $client)
    {
        return Inertia::render('Admin/Clients/CreateSite', [
            'client' => $client,
        ]);
    }

    public function storeSite(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'special_instructions' => 'nullable|string',
            'required_guards' => 'required|integer|min:1',
            'services_requested' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $client->sites()->create($validated);

        return redirect()->route('admin.clients.show', $client)
            ->with('success', 'Site added successfully.');
    }
}