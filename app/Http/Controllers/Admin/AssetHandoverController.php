<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AssetHandover;
use App\Models\Equipment;
use App\Models\User;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AssetHandoverController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'asset_type' => ['required', Rule::in(['equipment', 'vehicle'])],
            'asset_id' => ['required', 'integer'],
            'handed_to' => ['required', 'integer', 'exists:users,id'],
            'condition_out' => ['required', 'string', 'max:255'],
            'serial' => ['nullable', 'string', 'max:150'],
            'color' => ['nullable', 'string', 'max:100'],
            'notes_out' => ['nullable', 'string'],
        ]);

        $asset = $this->findAsset($data['asset_type'], $data['asset_id']);

        $alreadyOpen = AssetHandover::where('asset_type', $data['asset_type'])
            ->where('asset_id', $data['asset_id'])
            ->whereNull('returned_at')
            ->first();

        if ($alreadyOpen) {
            return back()->withErrors(['asset_id' => 'This asset is already handed over and not yet returned.'])->withInput();
        }

        $handover = AssetHandover::create([
            'asset_type' => $data['asset_type'],
            'asset_id' => $data['asset_id'],
            'handed_over_by' => $request->user()->id,
            'handed_to' => $data['handed_to'],
            'condition_out' => $data['condition_out'],
            'serial' => $data['serial'] ?? null,
            'color' => $data['color'] ?? null,
            'notes_out' => $data['notes_out'] ?? null,
        ]);

        // Update assignment on the asset for visibility
        $this->updateAssetAssignment($asset, $data['handed_to']);

        return back()->with('success', 'Asset handed over successfully.');
    }

    public function returnAsset(Request $request, AssetHandover $handover): RedirectResponse
    {
        if ($handover->returned_at) {
            return back()->withErrors(['handover' => 'This handover is already closed.']);
        }

        $data = $request->validate([
            'condition_in' => ['required', 'string', 'max:255'],
            'notes_in' => ['nullable', 'string'],
        ]);

        $handover->update([
            'condition_in' => $data['condition_in'],
            'notes_in' => $data['notes_in'] ?? null,
            'returned_at' => Carbon::now(),
        ]);

        $asset = $this->findAsset($handover->asset_type, $handover->asset_id);
        $this->updateAssetAssignment($asset, null);

        return back()->with('success', 'Asset return recorded.');
    }

    private function findAsset(string $type, int $id)
    {
        return match ($type) {
            'equipment' => Equipment::findOrFail($id),
            'vehicle' => Vehicle::findOrFail($id),
            default => abort(404),
        };
    }

    private function updateAssetAssignment($asset, ?int $userId): void
    {
        if (! $asset) {
            return;
        }

        $asset->assigned_to = $userId;
        $asset->save();
    }
}
