<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use App\Models\Vehicle;
use App\Models\Equipment;
use App\Models\Requisition;
use App\Models\VehicleUtilizationLog;
use App\Models\VehicleFuelLog;
use App\Models\VehicleMaintenanceLog;
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

        // 30-day activity metrics
        $from = now()->subDays(30)->startOfDay();
        $utilHours = (float) VehicleUtilizationLog::where('date', '>=', $from)->sum('hours');
        $utilKm = (int) VehicleUtilizationLog::where('date', '>=', $from)->sum('kilometers');
        $fuelLiters = (float) VehicleFuelLog::where('date', '>=', $from)->sum('liters');
        $fuelCost = (float) VehicleFuelLog::where('date', '>=', $from)->sum('cost');
        $maintCost = (float) VehicleMaintenanceLog::where('date', '>=', $from)->sum('cost');
        $maintDowntime = (int) VehicleMaintenanceLog::where('date', '>=', $from)->sum('down_time_hours');

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
            // Activity (last 30 days)
            'util_hours_30d' => round($utilHours, 2),
            'util_km_30d' => (int) $utilKm,
            'fuel_liters_30d' => round($fuelLiters, 2),
            'fuel_cost_30d' => round($fuelCost, 2),
            'maint_cost_30d' => round($maintCost, 2),
            'maint_downtime_30d' => (int) $maintDowntime,
        ];

        $pendingDisbursement = Requisition::query()
            ->where('status', 'pending_disbursement')
            ->with('requestedBy')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return Inertia::render('Admin/AssetManagement', [
            'summary' => $summary,
            'pendingDisbursement' => $pendingDisbursement,
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
