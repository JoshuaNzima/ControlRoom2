<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServicesController extends Controller
{
    public function index()
    {
        $services = Service::withCount('clients')
            ->select(['id', 'name', 'monthly_price', 'description', 'active'])
            ->get()
            ->map(function ($service) {
                $service->total_revenue = $service->clients_count * $service->monthly_price;
                return $service;
            });

        $stats = [
            'total_services' => $services->count(),
            'active_services' => $services->where('active', true)->count(),
            'total_monthly_revenue' => $services->sum('total_revenue'),
            'most_used_service' => $services->sortByDesc('clients_count')->first()->name ?? 'N/A'
        ];

        return Inertia::render('Admin/Services/Index', [
            'services' => $services,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'monthly_price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'active' => 'required|boolean',
        ]);

        Service::create($validated);

        return redirect()->back()->with('success', 'Service created successfully');
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'monthly_price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'active' => 'required|boolean',
        ]);

        $service->update($validated);

        return redirect()->back()->with('success', 'Service updated successfully');
    }

    public function destroy(Service $service)
    {
        $service->delete();
        return redirect()->back()->with('success', 'Service deleted successfully');
    }
}