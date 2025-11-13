<?php

namespace App\Http\Controllers\Finance;

use App\Models\Budget;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BudgetController extends Controller
{
    /**
     * Display a listing of budgets
     */
    public function index(Request $request)
    {
        $query = Budget::with('user')
            ->orderBy('fiscal_year', 'desc')
            ->orderBy('fiscal_month', 'desc');

        // Filter by fiscal year
        if ($request->filled('fiscal_year')) {
            $query->byFiscalYear($request->fiscal_year);
        } else {
            // Default to current year
            $query->byFiscalYear(now()->year);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->byStatus($request->status);
        }

        $budgets = $query->paginate(20);

        // Calculate summary
        $summary = [
            'total_budgeted' => Budget::active()->sum('budgeted_amount'),
            'total_spent' => 0,
            'budgets_exceeded' => 0,
        ];

        return Inertia::render('Finance/Budgets/Index', [
            'budgets' => $budgets,
            'summary' => $summary,
            'filters' => [
                'fiscal_year' => $request->fiscal_year ?? now()->year,
                'status' => $request->status,
            ],
            'years' => range(now()->year - 3, now()->year + 1),
        ]);
    }

    /**
     * Show the form for creating a new budget
     */
    public function create()
    {
        $expenseCategories = [
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

        return Inertia::render('Finance/Budgets/Create', [
            'categories' => $expenseCategories,
            'currentYear' => now()->year,
        ]);
    }

    /**
     * Store a newly created budget
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'budgeted_amount' => 'required|numeric|min:0.01',
            'fiscal_year' => 'required|integer|min:2000|max:2100',
            'fiscal_month' => 'nullable|integer|min:1|max:12',
            'description' => 'nullable|string',
        ]);

        $budget = Budget::create([
            ...$validated,
            'user_id' => Auth::id(),
            'status' => 'active',
        ]);

        return redirect()->route('finance.budgets.show', $budget)
            ->with('success', 'Budget created successfully.');
    }

    /**
     * Display a specific budget
     */
    public function show(Budget $budget)
    {
        $budget->load('user');

        return Inertia::render('Finance/Budgets/Show', [
            'budget' => $budget,
            'spent' => $budget->getTotalSpent(),
            'remaining' => $budget->getRemainingBudget(),
            'percentageSpent' => $budget->getPercentageSpent(),
            'isExceeded' => $budget->isExceeded(),
            'isCriticallyLow' => $budget->isCriticallyLow(),
        ]);
    }

    /**
     * Show the form for editing a budget
     */
    public function edit(Budget $budget)
    {
        $this->authorize('update', $budget);

        $expenseCategories = [
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

        return Inertia::render('Finance/Budgets/Edit', [
            'budget' => $budget,
            'categories' => $expenseCategories,
        ]);
    }

    /**
     * Update a budget
     */
    public function update(Request $request, Budget $budget)
    {
        $this->authorize('update', $budget);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'budgeted_amount' => 'required|numeric|min:0.01',
            'fiscal_year' => 'required|integer|min:2000|max:2100',
            'fiscal_month' => 'nullable|integer|min:1|max:12',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive,archived',
        ]);

        $budget->update($validated);

        return redirect()->route('finance.budgets.show', $budget)
            ->with('success', 'Budget updated successfully.');
    }

    /**
     * Delete a budget
     */
    public function destroy(Budget $budget)
    {
        $this->authorize('delete', $budget);

        $budget->delete();

        return redirect()->route('finance.budgets.index')
            ->with('success', 'Budget deleted successfully.');
    }
}
