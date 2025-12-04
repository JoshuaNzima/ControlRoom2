<?php

namespace App\Http\Controllers\Finance;

use App\Models\Expense;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    /**
     * Display a listing of expenses
     */
    public function index(Request $request)
    {
        $query = Expense::with('user')
            ->orderBy('expense_date', 'desc');

        // Filter by category
        if ($request->filled('category')) {
            $query->byCategory($request->category);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->byStatus($request->status);
        }

        // Filter by date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->byDateRange($request->start_date, $request->end_date);
        }

        // Filter by payment method
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        // Restrict visibility to own requisitions unless user can approve/manage
        $user = Auth::user();
        $canApprove = false;
        if ($user) {
            try {
                $canApprove = $user->hasAnyRole(['admin','super_admin','finance_officer','accountant','asset_manager'])
                    || $user->can('approve_expense')
                    || $user->can('manage_expense')
                    || $user->can('finance.approvals');
            } catch (\Throwable $e) {
                $canApprove = false;
            }
        }

        if (! $canApprove && $user) {
            $query->where('user_id', $user->id);
        }

        $expenses = $query->paginate(15)->withQueryString();

        // Calculate totals on the same filtered scope
        $base = Expense::query();
        if ($request->filled('category')) {
            $base->byCategory($request->category);
        }
        if ($request->filled('status')) {
            $base->byStatus($request->status);
        }
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $base->byDateRange($request->start_date, $request->end_date);
        }
        if ($request->filled('payment_method')) {
            $base->where('payment_method', $request->payment_method);
        }
        if (! $canApprove && $user) {
            $base->where('user_id', $user->id);
        }

        $totals = [
            'total' => (clone $base)->sum('amount'),
            'approved' => (clone $base)->approved()->sum('amount'),
            'pending' => (clone $base)->pending()->sum('amount'),
            'by_category' => (clone $base)->approved()
                ->selectRaw('category, SUM(amount) as total')
                ->groupBy('category')
                ->get(),
        ];

        return Inertia::render('Finance/Expenses/Index', [
            'expenses' => $expenses,
            'totals' => $totals,
            'filters' => [
                'category' => $request->category,
                'status' => $request->status,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'payment_method' => $request->payment_method,
            ],
        ]);
    }

    /**
     * Show the form for creating a new expense
     */
    public function create()
    {
        $categories = [
            'general',
            'office_supplies',
            'travel',
            'meals',
            'utilities',
            'maintenance',
            'marketing',
            'equipment',
            'other',
        ];

        $paymentMethods = ['cash', 'card', 'transfer', 'check'];

        return Inertia::render('Finance/Expenses/Create', [
            'categories' => $categories,
            'paymentMethods' => $paymentMethods,
        ]);
    }

    /**
     * Store a newly created expense
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'category' => 'required|string',
            'description' => 'nullable|string|max:255',
            'expense_date' => 'required|date',
            'account_id' => 'nullable',
            'payment_method' => 'required|in:cash,card,transfer,check',
            'notes' => 'nullable|string',
        ]);

        $expense = Expense::create([
            ...$validated,
            'user_id' => Auth::id(),
            'status' => 'pending', // start pending
            'approval_stage' => 'admin_pending', // first stage: admin approval
        ]);

        $routeName = request()->route() ? request()->route()->getName() : '';
        $isAdminAlias = is_string($routeName) && str_starts_with($routeName, 'admin.requisitions');
        return redirect()->route($isAdminAlias ? 'admin.requisitions.index' : 'finance.expenses.index')
            ->withSuccess('Expense created successfully. Awaiting approval.');
    }

    /**
     * Display a specific expense
     */
    public function show(Request $request, Expense $expense)
    {
        $expense->load('user');

        // Restrict viewing to owner unless approver/manager
        $user = Auth::user();
        $canApprove = false;
        if ($user) {
            try {
                $canApprove = $user->hasAnyRole(['admin','super_admin','finance_officer','accountant'])
                    || $user->can('approve_expense')
                    || $user->can('manage_expense')
                    || $user->can('finance.approvals');
            } catch (\Throwable $e) {
                $canApprove = false;
            }
        }
        if (! $canApprove && $user && $expense->user_id !== $user->id) {
            abort(403);
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json($expense);
        }

        return Inertia::render('Finance/Expenses/Show', [
            'expense' => $expense,
        ]);
    }

    /**
     * Show the form for editing an expense
     */
    public function edit(Expense $expense)
    {
        $this->authorize('update', $expense);

        $categories = [
            'general',
            'office_supplies',
            'travel',
            'meals',
            'utilities',
            'maintenance',
            'marketing',
            'equipment',
            'other',
        ];

        $paymentMethods = ['cash', 'card', 'transfer', 'check'];

        return Inertia::render('Finance/Expenses/Edit', [
            'expense' => $expense,
            'categories' => $categories,
            'paymentMethods' => $paymentMethods,
        ]);
    }

    /**
     * Update an expense
     */
    public function update(Request $request, Expense $expense)
    {
        $this->authorize('update', $expense);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'category' => 'required|string',
            'description' => 'nullable|string|max:255',
            'expense_date' => 'required|date',
            'account_id' => 'nullable',
            'payment_method' => 'required|in:cash,card,transfer,check',
            'notes' => 'nullable|string',
        ]);

        $expense->update($validated);

        $routeName = request()->route() ? request()->route()->getName() : '';
        $isAdminAlias = is_string($routeName) && str_starts_with($routeName, 'admin.requisitions');
        return redirect()->route($isAdminAlias ? 'admin.requisitions.index' : 'finance.expenses.index')
            ->withSuccess('Expense updated successfully.');
    }

    /**
     * Delete an expense
     */
    public function destroy(Expense $expense)
    {
        $this->authorize('delete', $expense);

        $expense->delete();

        $routeName = request()->route() ? request()->route()->getName() : '';
        $isAdminAlias = is_string($routeName) && str_starts_with($routeName, 'admin.requisitions');
        return redirect()->route($isAdminAlias ? 'admin.requisitions.index' : 'finance.expenses.index')
            ->withSuccess('Expense deleted successfully.');
    }

    /**
     * Approve an expense (admin only)
     */
    public function approve(Expense $expense)
    {
        $this->authorize('approve', $expense);

        $stage = $expense->approval_stage ?? 'admin_pending';
        if ($stage === 'admin_pending') {
            $expense->update([
                'admin_approved_by' => Auth::id(),
                'admin_approved_at' => now(),
                'approval_stage' => 'asset_pending',
                'status' => 'pending',
            ]);
            return back()->withSuccess('Requisition forwarded to Assets Manager for approval.');
        }
        if ($stage === 'asset_pending') {
            $expense->update([
                'asset_approved_by' => Auth::id(),
                'asset_approved_at' => now(),
                'approval_stage' => 'complete',
                'status' => 'approved',
            ]);
            return back()->withSuccess('Requisition approved.');
        }

        return back()->withErrors('Invalid approval stage.');
    }

    /**
     * Reject an expense (admin only)
     */
    public function reject(Request $request, Expense $expense)
    {
        $this->authorize('reject', $expense);

        $request->validate([
            'reason' => 'nullable|string',
        ]);

        $reason = (string) ($request->reason ?? '');
        $expense->update([
            'status' => 'rejected',
            'approval_stage' => 'rejected',
            'rejected_by' => Auth::id(),
            'rejected_at' => now(),
            'rejection_reason' => $reason,
            'notes' => ($expense->notes ? $expense->notes . "\n" : '') . (strlen($reason) ? ("Rejected: " . $reason) : 'Rejected'),
        ]);

        return back()->withSuccess('Requisition rejected.');
    }

    /**
     * Resubmit a rejected expense (requisition) back to Admin stage
     */
    public function resubmit(Request $request, Expense $expense)
    {
        $this->authorize('resubmit', $expense);
        $expense->update([
            'status' => 'pending',
            'approval_stage' => 'admin_pending',
            'admin_approved_by' => null,
            'admin_approved_at' => null,
            'asset_approved_by' => null,
            'asset_approved_at' => null,
            'rejected_by' => null,
            'rejected_at' => null,
            'rejection_reason' => null,
        ]);
        return back()->withSuccess('Requisition resubmitted for approval.');
    }
}
