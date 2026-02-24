<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Commission;
use App\Models\CommissionSplit;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommissionController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Commission::with(['client', 'splits.user', 'approver', 'payer'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('source') && $request->source !== 'all') {
            $query->where('source', $request->source);
        }

        $commissions = $query->paginate(20)->withQueryString();

        // Stats
        $stats = [
            'total_pending' => Commission::where('status', 'pending')->count(),
            'total_approved' => Commission::where('status', 'approved')->count(),
            'total_paid' => Commission::where('status', 'paid')->count(),
            'total_amount_pending' => Commission::where('status', 'pending')->sum('total_amount'),
            'total_amount_paid' => Commission::where('status', 'paid')->sum('total_amount'),
        ];

        return Inertia::render('Admin/Commissions/Index', [
            'commissions' => $commissions,
            'stats' => $stats,
            'filters' => $request->only(['status', 'source']),
        ]);
    }

    public function create(Request $request): Response
    {
        $clients = Client::select('id', 'name')->orderBy('name')->get();
        $users = User::select('id', 'name', 'email')
            ->whereHas('roles', function($q) {
                $q->whereIn('name', ['supervisor', 'sergeant', 'sales', 'admin']);
            })
            ->orWhereHas('employeeProfile')
            ->orderBy('name')
            ->get();

        // If client_id is provided, pre-select it
        $preselectedClient = null;
        if ($request->has('client_id')) {
            $preselectedClient = Client::find($request->client_id);
        }

        return Inertia::render('Admin/Commissions/Create', [
            'clients' => $clients,
            'users' => $users,
            'preselectedClient' => $preselectedClient,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'total_amount' => 'required|numeric|min:0',
            'source' => 'required|in:client_acquisition,contract_renewal,upsell',
            'description' => 'nullable|string',
            'splits' => 'required|array|min:1',
            'splits.*.user_id' => 'required|exists:users,id',
            'splits.*.percentage' => 'required|numeric|min:0|max:100',
            'splits.*.role' => 'required|in:primary,split',
            'notes' => 'nullable|string',
        ]);

        // Validate total percentage = 100%
        $totalPercentage = collect($validated['splits'])->sum('percentage');
        if (abs($totalPercentage - 100) > 0.01) {
            return back()->withErrors(['splits' => 'Total percentage must equal 100%']);
        }

        $commission = Commission::create([
            'client_id' => $validated['client_id'],
            'total_amount' => $validated['total_amount'],
            'source' => $validated['source'],
            'description' => $validated['description'] ?? null,
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        // Create splits
        foreach ($validated['splits'] as $split) {
            CommissionSplit::create([
                'commission_id' => $commission->id,
                'user_id' => $split['user_id'],
                'percentage' => $split['percentage'],
                'amount' => $commission->total_amount * ($split['percentage'] / 100),
                'role' => $split['role'],
            ]);
        }

        return redirect()->route('admin.commissions.index')
            ->with('success', 'Commission created successfully');
    }

    public function show(Commission $commission): Response
    {
        $commission->load(['client', 'splits.user', 'approver', 'payer']);

        return Inertia::render('Admin/Commissions/Show', [
            'commission' => $commission,
        ]);
    }

    public function edit(Commission $commission): Response
    {
        $commission->load(['client', 'splits.user']);
        $clients = Client::select('id', 'name')->orderBy('name')->get();
        $users = User::select('id', 'name', 'email')
            ->whereHas('roles', function($q) {
                $q->whereIn('name', ['supervisor', 'sergeant', 'sales', 'admin']);
            })
            ->orWhereHas('employeeProfile')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Commissions/Edit', [
            'commission' => $commission,
            'clients' => $clients,
            'users' => $users,
        ]);
    }

    public function update(Request $request, Commission $commission)
    {
        // Only allow updates if not paid
        if ($commission->status === 'paid') {
            return back()->withErrors(['error' => 'Cannot edit paid commission']);
        }

        $validated = $request->validate([
            'total_amount' => 'required|numeric|min:0',
            'source' => 'required|in:client_acquisition,contract_renewal,upsell',
            'description' => 'nullable|string',
            'splits' => 'required|array|min:1',
            'splits.*.user_id' => 'required|exists:users,id',
            'splits.*.percentage' => 'required|numeric|min:0|max:100',
            'splits.*.role' => 'required|in:primary,split',
            'notes' => 'nullable|string',
        ]);

        // Validate total percentage = 100%
        $totalPercentage = collect($validated['splits'])->sum('percentage');
        if (abs($totalPercentage - 100) > 0.01) {
            return back()->withErrors(['splits' => 'Total percentage must equal 100%']);
        }

        $commission->update([
            'total_amount' => $validated['total_amount'],
            'source' => $validated['source'],
            'description' => $validated['description'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Delete old splits and recreate
        $commission->splits()->delete();
        foreach ($validated['splits'] as $split) {
            CommissionSplit::create([
                'commission_id' => $commission->id,
                'user_id' => $split['user_id'],
                'percentage' => $split['percentage'],
                'amount' => $commission->total_amount * ($split['percentage'] / 100),
                'role' => $split['role'],
            ]);
        }

        return redirect()->route('admin.commissions.index')
            ->with('success', 'Commission updated successfully');
    }

    public function destroy(Commission $commission)
    {
        if ($commission->status === 'paid') {
            return back()->withErrors(['error' => 'Cannot delete paid commission']);
        }

        $commission->splits()->delete();
        $commission->delete();

        return redirect()->route('admin.commissions.index')
            ->with('success', 'Commission deleted successfully');
    }

    public function approve(Request $request, Commission $commission)
    {
        if ($commission->status !== 'pending') {
            return back()->withErrors(['error' => 'Only pending commissions can be approved']);
        }

        $commission->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return back()->with('success', 'Commission approved successfully');
    }

    public function markAsPaid(Request $request, Commission $commission)
    {
        if ($commission->status !== 'approved') {
            return back()->withErrors(['error' => 'Only approved commissions can be marked as paid']);
        }

        $commission->update([
            'status' => 'paid',
            'paid_at' => now(),
            'paid_by' => auth()->id(),
        ]);

        return back()->with('success', 'Commission marked as paid');
    }

    public function reject(Request $request, Commission $commission)
    {
        if ($commission->status === 'paid') {
            return back()->withErrors(['error' => 'Cannot reject paid commission']);
        }

        $commission->update([
            'status' => 'rejected',
            'notes' => $request->input('reason', $commission->notes),
        ]);

        return back()->with('success', 'Commission rejected');
    }

    // Get commission summary for KPI dashboard
    public function summary(): array
    {
        $currentMonth = now()->month;
        $currentYear = now()->year;

        return [
            'total_commissions' => Commission::count(),
            'total_amount' => Commission::sum('total_amount'),
            'pending_amount' => Commission::where('status', 'pending')->sum('total_amount'),
            'approved_amount' => Commission::where('status', 'approved')->sum('total_amount'),
            'paid_amount' => Commission::where('status', 'paid')->sum('total_amount'),
            'this_month_count' => Commission::whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count(),
            'this_month_amount' => Commission::whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->sum('total_amount'),
            'by_source' => Commission::selectRaw('source, COUNT(*) as count, SUM(total_amount) as amount')
                ->groupBy('source')
                ->get(),
            'by_status' => Commission::selectRaw('status, COUNT(*) as count, SUM(total_amount) as amount')
                ->groupBy('status')
                ->get(),
        ];
    }
}
