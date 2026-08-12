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
        $category = request('category');
        $equipment = Equipment::when($category, fn($q) => $q->where('category', $category))
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->appends(request()->only('category'));
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
            'filters' => ['category' => $category],
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

    /**
     * Check inventory availability for compliance items.
     * Returns whether there's available inventory for the given item.
     */
    public function checkInventory(Request $request)
    {
        $request->validate([
            'item' => ['required', 'string', 'max:100'],
            'type' => ['nullable', 'string', 'in:equipment,uniform'],
        ]);

        $item = $request->input('item');
        $type = $request->input('type', 'equipment');

        // Normalize item name for matching
        $normalizedName = strtolower(trim($item));
        $normalizedCategory = $type === 'uniform' ? 'uniform' : null;

        // Count available equipment in assets (active and not assigned)
        $availableCount = Equipment::where('status', 'active')
            ->where(function ($q) use ($normalizedName, $normalizedCategory, $item) {
                $q->where('name', 'like', "%{$item}%")
                    ->orWhere('category', 'like', "%{$item}%");
                if ($normalizedCategory) {
                    $q->orWhere('category', $normalizedCategory);
                }
            })
            ->whereNull('assigned_to')
            ->count();

        // Count total active equipment matching the item
        $totalCount = Equipment::where('status', 'active')
            ->where(function ($q) use ($normalizedName, $normalizedCategory, $item) {
                $q->where('name', 'like', "%{$item}%")
                    ->orWhere('category', 'like', "%{$item}%");
                if ($normalizedCategory) {
                    $q->orWhere('category', $normalizedCategory);
                }
            })
            ->count();

        // Count how many guards have this equipment issued
        $issuedCount = \App\Models\Guards\Guard::whereJsonContains('equipment_issued', $item)->count();

        // For uniform, count guards with uniform_issued = true
        $uniformIssuedCount = $type === 'uniform'
            ? \App\Models\Guards\Guard::where('uniform_issued', true)->count()
            : 0;

        $hasAvailable = $availableCount > 0;
        $exceedsInventory = ($type === 'uniform' ? $uniformIssuedCount : $issuedCount) >= $totalCount && $totalCount > 0;

        return response()->json([
            'item' => $item,
            'type' => $type,
            'available_count' => $availableCount,
            'total_count' => $totalCount,
            'issued_count' => $type === 'uniform' ? $uniformIssuedCount : $issuedCount,
            'has_available' => $hasAvailable,
            'exceeds_inventory' => $exceedsInventory,
            'needs_creation' => $totalCount === 0 || $exceedsInventory,
        ]);
    }

    /**
     * Quick-create equipment from compliance check.
     * Creates a new equipment item and returns it for asset manager to manage.
     */
    public function quickCreateFromCompliance(Request $request)
    {
        $request->validate([
            'item' => ['required', 'string', 'max:100'],
            'type' => ['nullable', 'string', 'in:equipment,uniform'],
            'guard_id' => ['nullable', 'integer', 'exists:guards,id'],
        ]);

        $item = $request->input('item');
        $type = $request->input('type', 'equipment');
        $guardId = $request->input('guard_id');

        // Generate a unique tag
        $tag = 'EQ-' . strtoupper(str_replace(' ', '-', $item)) . '-' . str_pad(Equipment::max('id') + 1, 4, '0', STR_PAD_LEFT);

        // Determine category
        $category = $type === 'uniform' ? 'uniform' : strtolower($item);

        $equipment = Equipment::create([
            'tag' => $tag,
            'name' => $item,
            'category' => $category,
            'status' => 'active',
            'assigned_to' => null,
            'notes' => $guardId ? "Created from guard compliance check (Guard ID: {$guardId})" : 'Created from compliance check',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Equipment added to assets inventory',
            'equipment' => $equipment,
        ]);
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
