<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleUtilizationLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VehicleUtilizationController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('perPage', 15);
        $vehicleId = (int) $request->query('vehicle_id', 0);

        $logs = VehicleUtilizationLog::with('vehicle:id,tag,make,model')
            ->when($vehicleId > 0, fn($q) => $q->where('vehicle_id', $vehicleId))
            ->orderByDesc('date')
            ->paginate($perPage)
            ->through(function ($log) {
                return [
                    'id' => $log->id,
                    'date' => optional($log->date)->toDateString(),
                    'hours' => $log->hours,
                    'kilometers' => $log->kilometers,
                    'shift' => $log->shift,
                    'site' => $log->site,
                    'vehicle' => $log->vehicle ? [
                        'id' => $log->vehicle->id,
                        'tag' => $log->vehicle->tag,
                        'name' => trim(($log->vehicle->make ?? '').' '.($log->vehicle->model ?? '')),
                    ] : null,
                ];
            })
            ->withQueryString();

        $vehicles = Vehicle::orderBy('tag')->get(['id','tag','make','model']);

        return Inertia::render('Admin/AssetUtilization', [
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
            'hours' => ['nullable','numeric','min:0'],
            'kilometers' => ['nullable','integer','min:0'],
            'shift' => ['nullable','string','max:20'],
            'site' => ['nullable','string','max:255'],
        ]);
        $data['created_by'] = optional($request->user())->id;
        VehicleUtilizationLog::create($data);
        return back()->with('success', 'Utilization log created');
    }

    public function update(Request $request, VehicleUtilizationLog $log)
    {
        $data = $request->validate([
            'date' => ['sometimes','date'],
            'hours' => ['nullable','numeric','min:0'],
            'kilometers' => ['nullable','integer','min:0'],
            'shift' => ['nullable','string','max:20'],
            'site' => ['nullable','string','max:255'],
        ]);
        $log->update($data);
        return back()->with('success', 'Utilization log updated');
    }

    public function destroy(VehicleUtilizationLog $log)
    {
        $log->delete();
        return back()->with('success', 'Utilization log deleted');
    }

    public function export(Request $request)
    {
        $vehicleId = (int) $request->query('vehicle_id', 0);
        $items = VehicleUtilizationLog::with('vehicle:id,tag')
            ->when($vehicleId > 0, fn($q) => $q->where('vehicle_id', $vehicleId))
            ->orderByDesc('date')
            ->get();

        $filename = 'vehicle_utilization_logs_' . now()->format('Ymd_His') . '.csv';
        $rows = [];
        $rows[] = ['ID','Vehicle Tag','Date','Hours','Kilometers','Shift','Site'];
        foreach ($items as $it) {
            $rows[] = [
                $it->id,
                optional($it->vehicle)->tag,
                optional($it->date)->toDateString(),
                $it->hours,
                $it->kilometers,
                $it->shift,
                $it->site,
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
