<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleFuelLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VehicleFuelLogController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('perPage', 15);
        $vehicleId = (int) $request->query('vehicle_id', 0);

        $logs = VehicleFuelLog::with('vehicle:id,tag,make,model')
            ->when($vehicleId > 0, fn($q) => $q->where('vehicle_id', $vehicleId))
            ->orderByDesc('date')
            ->paginate($perPage)
            ->through(function ($log) {
                return [
                    'id' => $log->id,
                    'date' => optional($log->date)->toDateString(),
                    'liters' => $log->liters,
                    'cost' => $log->cost,
                    'odometer' => $log->odometer,
                    'vendor' => $log->vendor,
                    'vehicle' => $log->vehicle ? [
                        'id' => $log->vehicle->id,
                        'tag' => $log->vehicle->tag,
                        'name' => trim(($log->vehicle->make ?? '').' '.($log->vehicle->model ?? '')),
                    ] : null,
                ];
            })
            ->withQueryString();

        $vehicles = Vehicle::orderBy('tag')->get(['id','tag','make','model']);

        return Inertia::render('Admin/AssetFuel', [
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
            'liters' => ['required','numeric','min:0'],
            'cost' => ['nullable','numeric','min:0'],
            'odometer' => ['nullable','integer','min:0'],
            'vendor' => ['nullable','string','max:255'],
        ]);
        $data['created_by'] = optional($request->user())->id;
        VehicleFuelLog::create($data);
        return back()->with('success', 'Fuel log created');
    }

    public function update(Request $request, VehicleFuelLog $log)
    {
        $data = $request->validate([
            'date' => ['sometimes','date'],
            'liters' => ['sometimes','numeric','min:0'],
            'cost' => ['nullable','numeric','min:0'],
            'odometer' => ['nullable','integer','min:0'],
            'vendor' => ['nullable','string','max:255'],
        ]);
        $log->update($data);
        return back()->with('success', 'Fuel log updated');
    }

    public function destroy(VehicleFuelLog $log)
    {
        $log->delete();
        return back()->with('success', 'Fuel log deleted');
    }

    public function export(Request $request)
    {
        $vehicleId = (int) $request->query('vehicle_id', 0);
        $items = VehicleFuelLog::with('vehicle:id,tag')
            ->when($vehicleId > 0, fn($q) => $q->where('vehicle_id', $vehicleId))
            ->orderByDesc('date')
            ->get();

        $filename = 'vehicle_fuel_logs_' . now()->format('Ymd_His') . '.csv';
        $rows = [];
        $rows[] = ['ID','Vehicle Tag','Date','Liters','Cost','Odometer','Vendor'];
        foreach ($items as $it) {
            $rows[] = [
                $it->id,
                optional($it->vehicle)->tag,
                optional($it->date)->toDateString(),
                $it->liters,
                $it->cost,
                $it->odometer,
                $it->vendor,
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
