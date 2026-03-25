<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Models\RequisitionAttachment;
use App\Models\RequisitionBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class RequisitionsController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth']);
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Requisition::with(['requestedBy', 'approvedBy', 'disbursedBy', 'items', 'attachments'])
            ->orderBy('created_at', 'desc');

        // Apply role-based filtering
        if (!$user->hasAnyRole(['super_admin', 'finance_admin', 'admin'])) {
            $query->where('requested_by', $user->id);
        }

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $requisitions = $query->paginate(20)->withQueryString();

        // Calculate stats
        $stats = [
            'total' => Requisition::count(),
            'pending' => Requisition::where('status', 'pending')->count(),
            'approved' => Requisition::where('status', 'approved')->count(),
            'disbursed' => Requisition::where('status', 'disbursed')->count(),
            'total_amount' => Requisition::whereIn('status', ['approved', 'disbursed'])->sum('amount'),
        ];

        return Inertia::render('Requisitions/Index', [
            'requisitions' => $requisitions,
            'stats' => $stats,
            'filters' => $request->only(['status', 'category', 'date_from', 'date_to', 'search']),
            'can' => [
                'create' => $user->hasAnyRole(['super_admin', 'finance_admin', 'admin', 'user']),
                'approve' => $user->hasAnyRole(['super_admin', 'finance_admin', 'admin']),
                'disburse' => $user->hasAnyRole(['super_admin', 'finance_admin']),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'category' => 'required|string|in:operational,capital,emergency,marketing,other',
            'amount' => 'required|numeric|min:0.01',
            'needed_by' => 'nullable|date',
            'items' => 'nullable|array',
            'items.*.description' => 'required_with:items|string|max:255',
            'items.*.category' => 'required_with:items|string',
            'items.*.quantity' => 'required_with:items|numeric|min:1',
            'items.*.unit_price' => 'required_with:items|numeric|min:0',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240', // Max 10MB per file
        ]);

        $requisition = Requisition::create([
            'requested_by' => auth()->id(),
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category' => $validated['category'],
            'amount' => $validated['amount'],
            'needed_by' => $validated['needed_by'] ?? null,
            'status' => 'pending',
        ]);

        // Create line items if provided
        if (!empty($validated['items'])) {
            foreach ($validated['items'] as $item) {
                $requisition->items()->create([
                    'description' => $item['description'],
                    'category' => $item['category'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'amount' => $item['quantity'] * $item['unit_price'],
                    'status' => 'pending',
                ]);
            }
        }

        // Handle attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('requisitions/' . $requisition->id, 'private');
                $requisition->attachments()->create([
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                ]);
            }
        }

        return redirect()->route('requisitions.index')->with('success', 'Requisition created successfully.');
    }

    public function update(Request $request, Requisition $requisition)
    {
        // Only allow editing pending requisitions
        if ($requisition->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending requisitions can be edited.');
        }

        // Only creator or admin can edit
        if ($requisition->requested_by !== auth()->id() && !auth()->user()->hasAnyRole(['super_admin', 'finance_admin', 'admin'])) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'category' => 'required|string|in:operational,capital,emergency,marketing,other',
            'amount' => 'required|numeric|min:0.01',
            'needed_by' => 'nullable|date',
        ]);

        $requisition->update($validated);

        return redirect()->back()->with('success', 'Requisition updated successfully.');
    }

    public function destroy(Requisition $requisition)
    {
        // Only allow deleting pending requisitions
        if ($requisition->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending requisitions can be deleted.');
        }

        // Only creator or admin can delete
        if ($requisition->requested_by !== auth()->id() && !auth()->user()->hasAnyRole(['super_admin', 'finance_admin', 'admin'])) {
            abort(403, 'Unauthorized action.');
        }

        // Delete attachments from storage
        foreach ($requisition->attachments as $attachment) {
            Storage::disk('private')->delete($attachment->file_path);
        }

        $requisition->delete();

        return redirect()->route('requisitions.index')->with('success', 'Requisition deleted successfully.');
    }

    public function approve(Request $request, Requisition $requisition)
    {
        if ($requisition->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending requisitions can be approved.');
        }

        $validated = $request->validate([
            'notes_admin' => 'nullable|string|max:500',
        ]);

        $requisition->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'notes_admin' => $validated['notes_admin'] ?? null,
        ]);

        // Update all pending items to approved
        $requisition->items()->where('status', 'pending')->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Requisition approved successfully.');
    }

    public function decline(Request $request, Requisition $requisition)
    {
        if ($requisition->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending requisitions can be declined.');
        }

        $validated = $request->validate([
            'notes_admin' => 'required|string|max:500',
        ]);

        $requisition->update([
            'status' => 'declined',
            'approved_by' => auth()->id(),
            'notes_admin' => $validated['notes_admin'],
        ]);

        // Update all pending items to declined
        $requisition->items()->where('status', 'pending')->update([
            'status' => 'declined',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Requisition declined.');
    }

    public function disburse(Request $request, Requisition $requisition)
    {
        if (!in_array($requisition->status, ['approved', 'partially_disbursed'])) {
            return redirect()->back()->with('error', 'Only approved requisitions can be disbursed.');
        }

        $validated = $request->validate([
            'item_ids' => 'required|array',
            'item_ids.*' => 'exists:requisition_items,id',
            'notes_disbursement' => 'nullable|string|max:500',
        ]);

        // Disburse selected items
        foreach ($validated['item_ids'] as $itemId) {
            $item = RequisitionItem::find($itemId);
            if ($item && $item->requisition_id === $requisition->id && $item->isApproved()) {
                $item->update([
                    'status' => 'disbursed',
                    'disbursed_by' => auth()->id(),
                    'disbursed_at' => now(),
                    'notes_disbursement' => $validated['notes_disbursement'] ?? null,
                ]);
            }
        }

        // Update requisition status based on items
        $allItemsDisbursed = $requisition->items()->whereIn('status', ['pending', 'approved'])->doesntExist();
        $requisition->update([
            'status' => $allItemsDisbursed ? 'disbursed' : 'partially_disbursed',
            'disbursed_by' => auth()->id(),
            'notes_disbursement' => $validated['notes_disbursement'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Funds disbursed successfully.');
    }

    public function show(Requisition $requisition)
    {
        $requisition->load(['requestedBy', 'approvedBy', 'disbursedBy', 'items', 'attachments', 'batch']);

        return Inertia::render('Requisitions/Show', [
            'requisition' => $requisition,
            'can' => [
                'edit' => $requisition->status === 'pending' && ($requisition->requested_by === auth()->id() || auth()->user()->hasAnyRole(['super_admin', 'finance_admin', 'admin'])),
                'delete' => $requisition->status === 'pending' && ($requisition->requested_by === auth()->id() || auth()->user()->hasAnyRole(['super_admin', 'finance_admin', 'admin'])),
                'approve' => $requisition->status === 'pending' && auth()->user()->hasAnyRole(['super_admin', 'finance_admin', 'admin']),
                'disburse' => in_array($requisition->status, ['approved', 'partially_disbursed']) && auth()->user()->hasAnyRole(['super_admin', 'finance_admin']),
            ],
        ]);
    }

    public function downloadAttachment(Requisition $requisition, RequisitionAttachment $attachment)
    {
        // Ensure the attachment belongs to this requisition
        if ($attachment->requisition_id !== $requisition->id) {
            abort(404);
        }

        // Check if user has permission to view this requisition
        $user = auth()->user();
        if ($requisition->requested_by !== $user->id && !$user->hasAnyRole(['super_admin', 'finance_admin', 'admin'])) {
            abort(403, 'Unauthorized action.');
        }

        if (!Storage::disk('private')->exists($attachment->file_path)) {
            abort(404);
        }

        return Storage::disk('private')->download($attachment->file_path, $attachment->file_name);
    }

    public function reports(Request $request)
    {
        $user = auth()->user();
        
        if (!$user->hasAnyRole(['super_admin', 'finance_admin', 'admin'])) {
            abort(403, 'Unauthorized action.');
        }

        $year = $request->input('year', now()->year);
        
        $monthlyData = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthlyData[$m] = [
                'total' => Requisition::whereYear('created_at', $year)->whereMonth('created_at', $m)->sum('amount'),
                'approved' => Requisition::whereYear('created_at', $year)->whereMonth('created_at', $m)->whereIn('status', ['approved', 'disbursed'])->sum('amount'),
                'disbursed' => Requisition::whereYear('created_at', $year)->whereMonth('created_at', $m)->where('status', 'disbursed')->sum('amount'),
                'count' => Requisition::whereYear('created_at', $year)->whereMonth('created_at', $m)->count(),
            ];
        }

        $byCategory = Requisition::whereYear('created_at', $year)
            ->whereIn('status', ['approved', 'disbursed'])
            ->selectRaw('category, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('category')
            ->get();

        return Inertia::render('Requisitions/Reports', [
            'year' => $year,
            'monthly_data' => $monthlyData,
            'by_category' => $byCategory,
        ]);
    }
}
