<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AssetHandover;
use App\Models\Vehicle;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VehicleController extends Controller
{
    public function index()
    {
        $vehicles = Vehicle::orderBy('created_at', 'desc')->paginate(15);
        $user = auth()->user();
        $openHandovers = AssetHandover::where('asset_type', 'vehicle')
            ->whereNull('returned_at')
            ->with('handedTo:id,name')
            ->get()
            ->mapWithKeys(function (AssetHandover $handover) {
                return [
                    $handover->asset_id => [
                        'id' => $handover->id,
                        'asset_id' => $handover->asset_id,
                        'handed_to' => $handover->handed_to,
                        'handed_to_user' => $handover->handedTo ? [
                            'id' => $handover->handedTo->id,
                            'name' => $handover->handedTo->name,
                        ] : null,
                        'condition_out' => $handover->condition_out,
                        'serial' => $handover->serial,
                        'color' => $handover->color,
                        'notes_out' => $handover->notes_out,
                    ],
                ];
            });

        return Inertia::render('Admin/AssetVehicles', [
            'vehicles' => $vehicles,
            'options' => [
                'statuses' => Vehicle::STATUSES,
                'users' => User::orderBy('name')->get(['id','name']),
            ],
            'openHandovers' => $openHandovers,
            'auth' => [
                'user' => [
                    'name' => $user?->name,
                ],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        Vehicle::create($data);
        return redirect()->route('assets.vehicles.index');
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        $data = $this->validateData($request);
        $vehicle->update($data);
        return redirect()->route('assets.vehicles.index');
    }

    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();
        return redirect()->route('assets.vehicles.index');
    }

    public function showJson(Vehicle $vehicle)
    {
        return response()->json($vehicle);
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'tag' => ['required','string','max:50'],
            'make' => ['nullable','string','max:100'],
            'model' => ['nullable','string','max:100'],
            'year' => ['nullable','integer','min:1900','max:2100'],
            'status' => ['required','in:' . implode(',', Vehicle::STATUSES)],
            'odometer' => ['nullable','integer','min:0'],
            'assigned_to' => ['nullable','integer','exists:users,id'],
            'notes' => ['nullable','string'],
        ]);
    }
}
