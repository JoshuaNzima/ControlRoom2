<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\VehicleDispatch;
use App\Models\Vehicle;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Carbon\Carbon;

class VehicleDispatchController extends Controller
{
    public function index()
    {
        $open = VehicleDispatch::with(['vehicle', 'driver'])
            ->where('status', 'dispatched')
            ->whereNull('returned_at')
            ->orderByDesc('dispatched_at')
            ->get()
            ->map(function (VehicleDispatch $d) {
                return [
                    'id' => $d->id,
                    'vehicle' => [ 'id' => $d->vehicle?->id, 'tag' => $d->vehicle?->tag, 'make' => $d->vehicle?->make, 'model' => $d->vehicle?->model ],
                    'driver' => [ 'id' => $d->driver?->id, 'name' => $d->driver?->name ],
                    'odometer_out' => $d->odometer_out,
                    'fuel_level_out' => $d->fuel_level_out,
                    'origin_site_id' => $d->origin_site_id,
                    'destination_site_id' => $d->destination_site_id,
                    'dispatched_at' => optional($d->dispatched_at)->toDateTimeString(),
                    'purpose' => $d->purpose,
                ];
            });

        $recent = VehicleDispatch::with(['vehicle', 'driver'])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(function (VehicleDispatch $d) {
                return [
                    'id' => $d->id,
                    'vehicle' => [ 'id' => $d->vehicle?->id, 'tag' => $d->vehicle?->tag ],
                    'driver' => [ 'id' => $d->driver?->id, 'name' => $d->driver?->name ],
                    'status' => $d->status,
                    'dispatched_at' => optional($d->dispatched_at)->toDateTimeString(),
                    'returned_at' => optional($d->returned_at)->toDateTimeString(),
                ];
            });

        $vehicles = Vehicle::where('status', 'active')->orderBy('tag')->get(['id','tag','make','model']);
        $drivers = Guard::whereIn('employee_role', ['driver','guard'])->where('status', 'active')->orderBy('name')->get(['id','name']);
        $sites = ClientSite::active()->orderBy('name')->get(['id','name']);

        return Inertia::render('ControlRoom/Dispatches/Index', [
            'openDispatches' => $open,
            'recentDispatches' => $recent,
            'vehicles' => $vehicles,
            'drivers' => $drivers,
            'sites' => $sites,
            'auth' => [ 'user' => [ 'name' => auth()->user()?->name ]],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vehicle_id' => ['required','exists:vehicles,id'],
            'driver_id' => ['required','exists:guards,id'],
            'origin_site_id' => ['nullable','exists:client_sites,id'],
            'destination_site_id' => ['nullable','exists:client_sites,id'],
            'odometer_out' => ['nullable','integer','min:0'],
            'fuel_level_out' => ['nullable','integer','min:0','max:100'],
            'purpose' => ['nullable','string','max:500'],
            'notes_out' => ['nullable','string'],
        ]);

        $dispatch = VehicleDispatch::create(array_merge($data, [
            'status' => 'dispatched',
            'dispatched_at' => Carbon::now(),
            'created_by' => $request->user()?->id,
        ]));

        return redirect()->route('control-room.dispatches.index');
    }

    public function returnVehicle(Request $request, VehicleDispatch $dispatch)
    {
        $data = $request->validate([
            'odometer_in' => ['nullable','integer','min:0'],
            'fuel_level_in' => ['nullable','integer','min:0','max:100'],
            'notes_in' => ['nullable','string'],
        ]);

        $dispatch->update(array_merge($data, [
            'status' => 'returned',
            'returned_at' => Carbon::now(),
        ]));

        return back();
    }
}
