<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ServicesController extends Controller
{
    public function index()
    {
        $services = Service::withCount('clients')
            ->withSum('clients', 'client_service.custom_price')
            ->get()
            ->map(function ($service) {
                return [
                    'id' => $service->id,
                    'name' => $service->name,
                    'description' => $service->description,
                    'monthly_price' => $service->monthly_price,
                    'active' => $service->active,
                    'client_count' => $service->clients_count,
                    'total_revenue' => $service->clients_sum_client_service_custom_price ?? ($service->clients_count * $service->monthly_price),
                ];
            });

        $stats = [
            'total_services' => Service::count(),
            'active_services' => Service::where('active', true)->count(),
            'total_monthly_revenue' => Service::withSum('clients', 'client_service.custom_price')
                ->get()
                ->sum(function ($service) {
                    return $service->clients_sum_client_service_custom_price ?? ($service->clients_count * $service->monthly_price);
                }),
            'most_used_service' => Service::withCount('clients')
                ->orderByDesc('clients_count')
                ->first()
                ?->name ?? 'N/A',
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
            'description' => 'nullable|string',
            'monthly_price' => 'required|numeric|min:0',
            'active' => 'boolean',
        ]);

        Service::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'monthly_price' => 'required|numeric|min:0',
            'active' => 'boolean',
        ]);

        $service->update($validated);

        return redirect()->back();
    }

    public function destroy(Service $service)
    {
        if ($service->clients()->exists()) {
            return redirect()->back()->withErrors(['error' => 'Cannot delete service that has clients.']);
        }

        $service->delete();

        return redirect()->back();
    }
}