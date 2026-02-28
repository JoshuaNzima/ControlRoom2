<?php

namespace App\Http\Controllers\Requisitions;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RequisitionItemController extends Controller
{
    public function store(Request $request, Requisition $requisition): RedirectResponse|JsonResponse
    {
        $this->authorizeOwner($request, $requisition);

        if ($requisition->status !== 'pending_admin') {
            throw ValidationException::withMessages([
                'requisition' => 'Can only add items to pending requisitions.',
            ]);
        }

        $data = $request->validate([
            'description' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'in:general,fuel,vehicle_hire,events,k9,utilities,office_supplies'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $item = $requisition->items()->create([
            'description' => $data['description'],
            'category' => $data['category'] ?? $requisition->category ?? 'general',
            'quantity' => $data['quantity'] ?? 1,
            'unit_price' => $data['unit_price'] ?? null,
            'amount' => $data['amount'],
            'status' => 'pending',
        ]);

        // Recalculate requisition total
        $this->recalculateTotal($requisition);

        if ($request->wantsJson()) {
            return response()->json(['ok' => true, 'item' => $item]);
        }

        return back();
    }

    public function update(Request $request, Requisition $requisition, RequisitionItem $item): RedirectResponse|JsonResponse
    {
        $this->authorizeOwner($request, $requisition);

        if ($item->requisition_id !== $requisition->id) {
            abort(404);
        }

        if ($item->status !== 'pending') {
            throw ValidationException::withMessages([
                'item' => 'Can only edit pending items.',
            ]);
        }

        $data = $request->validate([
            'description' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'in:general,fuel,vehicle_hire,events,k9,utilities,office_supplies'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $item->fill([
            'description' => $data['description'],
            'category' => $data['category'] ?? $item->category,
            'quantity' => $data['quantity'],
            'unit_price' => $data['unit_price'],
            'amount' => $data['amount'],
        ]);
        $item->save();

        // Recalculate requisition total
        $this->recalculateTotal($requisition);

        if ($request->wantsJson()) {
            return response()->json(['ok' => true, 'item' => $item]);
        }

        return back();
    }

    public function destroy(Request $request, Requisition $requisition, RequisitionItem $item): RedirectResponse|JsonResponse
    {
        $this->authorizeOwner($request, $requisition);

        if ($item->requisition_id !== $requisition->id) {
            abort(404);
        }

        if ($item->status !== 'pending') {
            throw ValidationException::withMessages([
                'item' => 'Can only delete pending items.',
            ]);
        }

        $item->delete();

        // Recalculate requisition total
        $this->recalculateTotal($requisition);

        if ($request->wantsJson()) {
            return response()->json(['ok' => true]);
        }

        return back();
    }

    public function approve(Request $request, Requisition $requisition, RequisitionItem $item): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin']), 403);

        if ($item->requisition_id !== $requisition->id) {
            abort(404);
        }

        if ($item->status !== 'pending') {
            throw ValidationException::withMessages([
                'item' => 'Item is not in pending status.',
            ]);
        }

        $data = $request->validate([
            'notes_admin' => ['nullable', 'string'],
        ]);

        $item->status = 'approved';
        $item->approved_by = $user->id;
        $item->approved_at = now();
        $item->notes_admin = $data['notes_admin'] ?? null;
        $item->save();

        // Update parent requisition status if all items are approved
        $this->updateParentStatus($requisition);

        if ($request->wantsJson()) {
            return response()->json(['ok' => true, 'item' => $item]);
        }

        return back();
    }

    public function decline(Request $request, Requisition $requisition, RequisitionItem $item): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super_admin']), 403);

        if ($item->requisition_id !== $requisition->id) {
            abort(404);
        }

        if ($item->status !== 'pending') {
            throw ValidationException::withMessages([
                'item' => 'Item is not in pending status.',
            ]);
        }

        $data = $request->validate([
            'notes_admin' => ['nullable', 'string'],
        ]);

        $item->status = 'declined';
        $item->approved_by = $user->id;
        $item->approved_at = now();
        $item->notes_admin = $data['notes_admin'] ?? null;
        $item->save();

        // Update parent requisition status
        $this->updateParentStatus($requisition);

        if ($request->wantsJson()) {
            return response()->json(['ok' => true, 'item' => $item]);
        }

        return back();
    }

    public function disburse(Request $request, Requisition $requisition, RequisitionItem $item): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['asset_manager', 'assets_manager', 'super_admin']), 403);

        if ($item->requisition_id !== $requisition->id) {
            abort(404);
        }

        if (!in_array($item->status, ['approved', 'funded'])) {
            throw ValidationException::withMessages([
                'item' => 'Item must be approved or funded before disbursement.',
            ]);
        }

        $data = $request->validate([
            'notes_disbursement' => ['nullable', 'string'],
        ]);

        $item->status = 'disbursed';
        $item->disbursed_by = $user->id;
        $item->disbursed_at = now();
        $item->notes_disbursement = $data['notes_disbursement'] ?? null;
        $item->save();

        // Check if all items are disbursed to update parent requisition
        $this->checkAllDisbursed($requisition);

        if ($request->wantsJson()) {
            return response()->json(['ok' => true, 'item' => $item]);
        }

        return back();
    }

    protected function authorizeOwner(Request $request, Requisition $requisition): void
    {
        abort_unless($request->user()->id === $requisition->requested_by, 403);
    }

    protected function recalculateTotal(Requisition $requisition): void
    {
        $total = $requisition->items()->sum('amount');
        $requisition->amount = $total;
        $requisition->save();
    }

    protected function updateParentStatus(Requisition $requisition): void
    {
        $items = $requisition->items;

        $allApproved = $items->every(fn($i) => in_array($i->status, ['approved', 'funded', 'disbursed']));
        $anyApproved = $items->contains(fn($i) => in_array($i->status, ['approved', 'funded', 'disbursed']));
        $anyDeclined = $items->contains(fn($i) => $i->status === 'declined');
        $allDeclined = $items->every(fn($i) => $i->status === 'declined');

        if ($allDeclined) {
            $requisition->status = 'needs_revision';
        } elseif ($allApproved) {
            $requisition->status = 'pending_disbursement';
            $requisition->approved_by = auth()->id();
            $requisition->approved_at = now();
        } elseif ($anyDeclined || $anyApproved) {
            // Partial approval - keep as pending_admin but note partial status
            // Could add a 'partially_approved' status if needed
            $requisition->status = 'pending_admin';
        }

        $requisition->save();
    }

    protected function checkAllDisbursed(Requisition $requisition): void
    {
        $allDisbursed = $requisition->items->every(fn($i) => $i->status === 'disbursed');

        if ($allDisbursed) {
            $requisition->status = 'disbursed';
            $requisition->save();
        }
    }
}
