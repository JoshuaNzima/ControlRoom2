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
        $services = \App\Models\Service::where('active', true)->orderBy('name')->get(['id','name','monthly_price']);
        return Inertia::render('Admin/Clients/Create', [
            'services' => $services,
        ]);
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
            'billing_start_date' => 'nullable|date',
            'services' => 'nullable|array',
            'services.*.id' => 'required_with:services|integer|exists:services,id',
            'services.*.custom_price' => 'nullable|numeric|min:0',
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

        $client = Client::create(collect($validated)->except(['site', 'services'])->toArray());

        // Attach services if provided (array of {id, custom_price})
        if (!empty($validated['services'])) {
            $attach = [];
            foreach ($validated['services'] as $svc) {
                $attach[(int) $svc['id']] = ['custom_price' => isset($svc['custom_price']) ? $svc['custom_price'] : null];
            }
            $client->services()->attach($attach);
        }

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
        $client->load('services', 'sites');
        $services = \App\Models\Service::where('active', true)->orderBy('name')->get(['id','name','monthly_price']);
        return Inertia::render('Admin/Clients/Edit', [
            'client' => $client,
            'services' => $services,
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
            'services' => 'nullable|array',
            'services.*.id' => 'required_with:services|integer|exists:services,id',
            'services.*.custom_price' => 'nullable|numeric|min:0',
        ]);

        $client->update($validated);

        // Sync services if provided
        if (array_key_exists('services', $validated)) {
            $sync = [];
            foreach ($validated['services'] as $svc) {
                $sync[(int) $svc['id']] = ['custom_price' => $svc['custom_price'] ?? null];
            }
            $client->services()->sync($sync);
        }

        return redirect()->route('clients.index')
            ->with('success', 'Client updated successfully.');
    }

    // Update just the services/pivot for a client (custom prices)
    public function updateServices(Request $request, Client $client)
    {
        $validated = $request->validate([
            'services' => 'nullable|array',
            'services.*.id' => 'required_with:services|integer|exists:services,id',
            'services.*.custom_price' => 'nullable|numeric|min:0',
        ]);

        $sync = [];
        foreach (($validated['services'] ?? []) as $svc) {
            $sync[(int) $svc['id']] = ['custom_price' => $svc['custom_price'] ?? null];
        }

        $client->services()->sync($sync);

        return redirect()->back()->with('success', 'Client services updated');
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