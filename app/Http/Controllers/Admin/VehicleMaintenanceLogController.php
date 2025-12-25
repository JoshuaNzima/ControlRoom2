<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleMaintenanceLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VehicleMaintenanceLogController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('perPage', 15);
        $vehicleId = (int) $request->query('vehicle_id', 0);

        $logs = VehicleMaintenanceLog::with('vehicle:id,tag,make,model')
            ->when($vehicleId > 0, fn($q) => $q->where('vehicle_id', $vehicleId))
            ->orderByDesc('date')
            ->paginate($perPage)
            ->through(function ($log) {
                return [
                    'id' => $log->id,
                    'date' => optional($log->date)->toDateString(),
                    'type' => $log->type,
                    'vendor' => $log->vendor,
                    'cost' => $log->cost,
                    'down_time_hours' => $log->down_time_hours,
                    'notes' => $log->notes,
                    'vehicle' => $log->vehicle ? [
                        'id' => $log->vehicle->id,
                        'tag' => $log->vehicle->tag,
                        'name' => trim(($log->vehicle->make ?? '').' '.($log->vehicle->model ?? '')),
                    ] : null,
                ];
            })
            ->withQueryString();

        $vehicles = Vehicle::orderBy('tag')->get(['id','tag','make','model']);

        return Inertia::render('Admin/AssetMaintenance', [
            'logs' => $logs,
            'vehicles' => $vehicles,
            'filters' => [ 'perPage' => $perPage, 'vehicle_id' => $vehicleId ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vehicle_id' => ['required','exists:vehicles,id'],
            'date' => ['required','date'],
            'type' => ['nullable','string','max:100'],
            'vendor' => ['nullable','string','max:255'],
            'cost' => ['nullable','numeric','min:0'],
            'down_time_hours' => ['nullable','integer','min:0'],
            'notes' => ['nullable','string'],
        ]);
        $data['created_by'] = optional($request->user())->id;
        VehicleMaintenanceLog::create($data);
        return back()->with('success', 'Maintenance log created');
    }

    public function update(Request $request, VehicleMaintenanceLog $log)
    {
        $data = $request->validate([
            'date' => ['sometimes','date'],
            'type' => ['nullable','string','max:100'],
            'vendor' => ['nullable','string','max:255'],
            'cost' => ['nullable','numeric','min:0'],
            'down_time_hours' => ['nullable','integer','min:0'],
            'notes' => ['nullable','string'],
        ]);
        $log->update($data);
        return back()->with('success', 'Maintenance log updated');
    }

    public function destroy(VehicleMaintenanceLog $log)
    {
        $log->delete();
        return back()->with('success', 'Maintenance log deleted');
    }

    public function export(Request $request)
    {
        $vehicleId = (int) $request->query('vehicle_id', 0);
        $items = VehicleMaintenanceLog::with('vehicle:id,tag')
            ->when($vehicleId > 0, fn($q) => $q->where('vehicle_id', $vehicleId))
            ->orderByDesc('date')
            ->get();

        $filename = 'vehicle_maintenance_logs_' . now()->format('Ymd_His') . '.csv';
        $rows = [];
        $rows[] = ['ID','Vehicle Tag','Date','Type','Vendor','Cost','Down Time (hrs)','Notes'];
        foreach ($items as $it) {
            $rows[] = [
                $it->id,
                optional($it->vehicle)->tag,
                optional($it->date)->toDateString(),
                $it->type,
                $it->vendor,
                $it->cost,
                $it->down_time_hours,
                $it->notes,
            ];
        }

        $callback = function () use ($rows) {
            $FH = fopen('php://output', 'w');
            foreach ($rows as $r) fputcsv($FH, $r);
            fclose($FH);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
