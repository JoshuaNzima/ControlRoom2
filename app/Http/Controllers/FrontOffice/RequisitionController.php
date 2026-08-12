<?php

namespace App\Http\Controllers\FrontOffice;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RequisitionController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $role = $this->getRole($user);

        $query = Requisition::with(['requestedBy', 'approvedBy'])
            ->orderBy('created_at', 'desc');

        // Non-executive assistants can only see their own requisitions
        if (!in_array($role, ['executive_assistant', 'super_admin', 'admin'])) {
            $query->where('requested_by', $user->id);
        }

        $requisitions = $query->paginate(20)->withQueryString();

        // Calculate stats based on user's visibility
        $statsQuery = Requisition::query();
        if (!in_array($role, ['executive_assistant', 'super_admin', 'admin'])) {
            $statsQuery->where('requested_by', $user->id);
        }

        $stats = [
            'total' => (clone $statsQuery)->count(),
            'pending' => (clone $statsQuery)->where('status', 'pending')->count(),
            'approved' => (clone $statsQuery)->where('status', 'approved')->count(),
            'disbursed' => (clone $statsQuery)->where('status', 'disbursed')->count(),
            'total_amount' => (clone $statsQuery)->whereIn('status', ['approved', 'disbursed'])->sum('amount'),
        ];

        return Inertia::render('FrontOffice/Requisitions/Index', [
            'requisitions' => $requisitions,
            'stats' => $stats,
            'filters' => $request->only(['status', 'priority', 'search']),
            'role' => $role,
            'can' => [
                'create' => true,
                'approve' => in_array($role, ['executive_assistant', 'super_admin', 'admin']),
                'manage_all' => in_array($role, ['executive_assistant', 'super_admin', 'admin']),
                'manage_calendar' => in_array($role, ['executive_assistant', 'personal_assistant', 'admin', 'super_admin']),
                'manage_tasks' => in_array($role, ['executive_assistant', 'personal_assistant', 'admin', 'super_admin']),
                'view_reports' => in_array($role, ['executive_assistant', 'admin', 'super_admin']),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high,urgent',
            'currency' => 'required|in:MWK,USD,ZAR',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.justification' => 'nullable|string',
        ]);

        $totalAmount = collect($validated['items'])->sum(function ($item) {
            return $item['quantity'] * $item['unit_price'];
        });

        $requisition = Requisition::create([
            'requisition_number' => $this->generateRequisitionNumber(),
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => 'pending',
            'currency' => $validated['currency'],
            'amount' => $totalAmount,
            'requested_by' => $request->user()->id,
        ]);

        foreach ($validated['items'] as $item) {
            $requisition->items()->create([
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total_price' => $item['quantity'] * $item['unit_price'],
                'justification' => $item['justification'],
            ]);
        }

        return back()->with('success', 'Requisition created successfully. Reference: ' . $requisition->requisition_number);
    }

    public function show(Requisition $requisition): Response
    {
        $requisition->load(['requestedBy', 'approvedBy', 'items']);

        return Inertia::render('FrontOffice/Requisitions/Show', [
            'requisition' => $requisition,
        ]);
    }

    private function generateRequisitionNumber(): string
    {
        $prefix = 'REQ' . now()->format('Ymd');
        $last = Requisition::whereDate('created_at', today())
            ->where('requisition_number', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->first();

        $seq = 1;
        if ($last && preg_match('/' . $prefix . '(\d{3})/', $last->requisition_number, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return $prefix . str_pad($seq, 3, '0', STR_PAD_LEFT);
    }

    private function getRole($user): string
    {
        $roles = $user->roles->pluck('name')->toArray();

        foreach (['executive_assistant', 'personal_assistant', 'receptionist', 'super_admin', 'admin'] as $r) {
            if (in_array($r, $roles)) {
                return $r;
            }
        }

        return 'receptionist';
    }
}
