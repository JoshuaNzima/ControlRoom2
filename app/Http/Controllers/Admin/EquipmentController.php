<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AssetHandover;
use App\Models\Equipment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EquipmentController extends Controller
{
    public function index()
    {
        $equipment = Equipment::orderBy('created_at', 'desc')->paginate(15);
        $user = auth()->user();
        $openHandovers = AssetHandover::where('asset_type', 'equipment')
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

        return Inertia::render('Admin/AssetEquipment', [
            'equipment' => $equipment,
            'options' => [
                'statuses' => Equipment::STATUSES,
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
        Equipment::create($data);
        return redirect()->route('assets.equipment.index');
    }

    public function update(Request $request, Equipment $equipment)
    {
        $data = $this->validateData($request);
        $equipment->update($data);
        return redirect()->route('assets.equipment.index');
    }

    public function destroy(Equipment $equipment)
    {
        $equipment->delete();
        return redirect()->route('assets.equipment.index');
    }

    public function showJson(Equipment $equipment)
    {
        return response()->json($equipment);
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'tag' => ['required','string','max:50'],
            'name' => ['required','string','max:150'],
            'category' => ['nullable','string','max:100'],
            'status' => ['required','in:' . implode(',', Equipment::STATUSES)],
            'assigned_to' => ['nullable','integer','exists:users,id'],
            'notes' => ['nullable','string'],
        ]);
    }
}
