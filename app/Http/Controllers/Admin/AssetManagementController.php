<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use App\Models\Vehicle;
use App\Models\Equipment;
use Illuminate\Support\Facades\DB;

class AssetManagementController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $totalVehicles = Vehicle::count();
        $totalEquipment = Equipment::count();
        $inServiceVehicles = Vehicle::where('status', 'active')->count();
        $inServiceEquipment = Equipment::where('status', 'active')->count();
        $assignedVehicles = Vehicle::whereNotNull('assigned_to')->count();
        $assignedEquipment = Equipment::whereNotNull('assigned_to')->count();

        $vehicleStatusCounts = [
            'active' => Vehicle::where('status', 'active')->count(),
            'maintenance' => Vehicle::where('status', 'maintenance')->count(),
            'retired' => Vehicle::where('status', 'retired')->count(),
        ];
        $equipmentStatusCounts = [
            'active' => Equipment::where('status', 'active')->count(),
            'maintenance' => Equipment::where('status', 'maintenance')->count(),
            'retired' => Equipment::where('status', 'retired')->count(),
            'lost' => Equipment::where('status', 'lost')->count(),
        ];

        $summary = [
            'total_assets' => $totalVehicles + $totalEquipment,
            'in_service_assets' => $inServiceVehicles + $inServiceEquipment,
            'total_vehicles' => $totalVehicles,
            'in_service_vehicles' => $inServiceVehicles,
            'total_equipment' => $totalEquipment,
            'in_service_equipment' => $inServiceEquipment,
            'assigned_vehicles' => $assignedVehicles,
            'assigned_equipment' => $assignedEquipment,
            'vehicle_status_counts' => $vehicleStatusCounts,
            'equipment_status_counts' => $equipmentStatusCounts,
        ];

        return Inertia::render('Admin/AssetManagement', [
            'summary' => $summary,
            'auth' => [
                'user' => [
                    'name' => $user?->name,
                    'roles' => $user?->roles ?? ['admin'],
                    'permissions' => $user?->permissions ?? [],
                ],
            ],
        ]);
    }
}
