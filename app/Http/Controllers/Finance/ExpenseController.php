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
        $query = Expense::with('user', 'account')
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

        $expenses = $query->paginate(15)->withQueryString();

        // Calculate totals
        $totals = [
            'total' => Expense::sum('amount'),
            'approved' => Expense::approved()->sum('amount'),
            'pending' => Expense::pending()->sum('amount'),
            'by_category' => Expense::selectRaw('category, SUM(amount) as total')
                ->approved()
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
            'account_id' => 'nullable|exists:accounts,id',
            'payment_method' => 'required|in:cash,card,transfer,check',
            'notes' => 'nullable|string',
        ]);

        $expense = Expense::create([
            ...$validated,
            'user_id' => Auth::id(),
            'status' => 'pending', // Expenses start as pending and need approval
        ]);

        return redirect()->route('finance.expenses.show', $expense)
            ->with('success', 'Expense created successfully. Awaiting approval.');
    }

    /**
     * Display a specific expense
     */
    public function show(Expense $expense)
    {
        $expense->load('user', 'account');

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
            'expense' => $expense->load('account'),
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
            'account_id' => 'nullable|exists:accounts,id',
            'payment_method' => 'required|in:cash,card,transfer,check',
            'notes' => 'nullable|string',
        ]);

        $expense->update($validated);

        return redirect()->route('finance.expenses.show', $expense)
            ->with('success', 'Expense updated successfully.');
    }

    /**
     * Delete an expense
     */
    public function destroy(Expense $expense)
    {
        $this->authorize('delete', $expense);

        $expense->delete();

        return redirect()->route('finance.expenses.index')
            ->with('success', 'Expense deleted successfully.');
    }

    /**
     * Approve an expense (admin only)
     */
    public function approve(Expense $expense)
    {
        $this->authorize('approve', $expense);

        $expense->update(['status' => 'approved']);

        return back()->with('success', 'Expense approved successfully.');
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

        $expense->update([
            'status' => 'rejected',
            'notes' => ($expense->notes ? $expense->notes . "\n" : '') . "Rejected: {$request->reason}",
        ]);

        return back()->with('success', 'Expense rejected.');
    }
}
