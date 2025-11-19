<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Expense;
use App\Models\Budget;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Prepare last 12 months labels
        $start = now()->subMonths(11)->startOfMonth();
        $months = [];
        $monthlyRevenue = [];
        $monthlyExpenses = [];

        for ($i = 0; $i < 12; $i++) {
            $m = $start->copy()->addMonths($i);
            $label = $m->format('M Y');
            $months[] = $label;

            $monthlyRevenue[] = (float) Invoice::whereYear('invoice_date', $m->year)
                ->whereMonth('invoice_date', $m->month)
                ->paid()
                ->sum('total_amount');

            $monthlyExpenses[] = (float) Expense::whereYear('expense_date', $m->year)
                ->whereMonth('expense_date', $m->month)
                ->approved()
                ->sum('amount');
        }

        // High level summaries
        $invoicesSummary = [
            'total' => (float) Invoice::sum('total_amount'),
            'paid' => (float) Invoice::paid()->sum('total_amount'),
            'unpaid' => (float) Invoice::unpaid()->sum('total_amount'),
            'overdue_count' => (int) Invoice::overdue()->count(),
            'overdue_amount' => (float) Invoice::overdue()->sum('total_amount'),
        ];

        $expensesSummary = [
            'total' => (float) Expense::sum('amount'),
            'approved' => (float) Expense::approved()->sum('amount'),
            'pending' => (float) Expense::pending()->sum('amount'),
        ];

        // Budgets
        $budgets = Budget::active()->get()->map(function ($b) {
            return [
                'id' => $b->id,
                'name' => $b->name,
                'category' => $b->category,
                'budgeted_amount' => (float) $b->budgeted_amount,
                'spent' => (float) $b->getTotalSpent(),
                'remaining' => (float) $b->getRemainingBudget(),
                'percentageSpent' => (float) $b->getPercentageSpent(),
                'isExceeded' => $b->isExceeded(),
            ];
        })->values();

        // Recent activity (expenses + invoices)
        $recentExpenses = Expense::with('user')
            ->latest('expense_date')
            ->take(5)
            ->get()
            ->map(function ($e) {
                return [
                    'type' => 'expense',
                    'id' => $e->id,
                    'amount' => (float) $e->amount,
                    'category' => $e->category,
                    'date' => optional($e->expense_date)->toDateString(),
                    'user' => $e->user?->name ?? null,
                ];
            });

        $recentInvoices = Invoice::with('user')
            ->latest('invoice_date')
            ->take(5)
            ->get()
            ->map(function ($i) {
                return [
                    'type' => 'invoice',
                    'id' => $i->id,
                    'amount' => (float) $i->total_amount,
                    'status' => $i->status,
                    'date' => optional($i->invoice_date)->toDateString(),
                    'user' => $i->user?->name ?? null,
                ];
            });

        $recent = $recentExpenses->concat($recentInvoices)
            ->sortByDesc('date')
            ->values()
            ->take(10);

        return Inertia::render('Finance/Dashboard', [
            'invoicesSummary' => $invoicesSummary,
            'expensesSummary' => $expensesSummary,
            'months' => $months,
            'monthlyRevenue' => $monthlyRevenue,
            'monthlyExpenses' => $monthlyExpenses,
            'budgets' => $budgets,
            'recent' => $recent,
            'auth' => [
                'user' => [
                    'name' => auth()->user()->name,
                    'roles' => auth()->user()->roles ?? [],
                    'permissions' => auth()->user()->permissions ?? [],
                ],
            ],
        ]);
    }

    /**
     * Return drill-down data for a specific month (year, month)
     */
    public function monthDrilldown($year, $month)
    {
        // Server-side permission guard via Gate
        Gate::authorize('finance.access');
        $invoices = Invoice::whereYear('invoice_date', $year)
            ->whereMonth('invoice_date', $month)
            ->with('user')
            ->get()
            ->map(function ($i) {
                return [
                    'id' => $i->id,
                    'invoice_number' => $i->invoice_number ?? null,
                    'amount' => (float) $i->total_amount,
                    'status' => $i->status,
                    'date' => optional($i->invoice_date)->toDateString(),
                    'user' => $i->user?->name ?? null,
                ];
            });

        $expenses = Expense::whereYear('expense_date', $year)
            ->whereMonth('expense_date', $month)
            ->with('user')
            ->get()
            ->map(function ($e) {
                return [
                    'id' => $e->id,
                    'amount' => (float) $e->amount,
                    'category' => $e->category,
                    'status' => $e->status,
                    'date' => optional($e->expense_date)->toDateString(),
                    'user' => $e->user?->name ?? null,
                ];
            });

        return response()->json([
            'year' => (int) $year,
            'month' => (int) $month,
            'invoices' => $invoices,
            'expenses' => $expenses,
            'totals' => [
                'invoices_total' => (float) $invoices->sum('amount'),
                'expenses_total' => (float) $expenses->sum('amount'),
            ],
        ]);
    }

    /**
     * Return drill-down data for a budget (expenses within the budget category)
     */
    public function budgetDrilldown(Budget $budget)
    {
        // Server-side permission guard via Gate
        Gate::authorize('finance.access');
        $expenses = Expense::where('category', $budget->category)
            ->approved()
            ->whereYear('expense_date', $budget->fiscal_year)
            ->when($budget->fiscal_month, fn($q) => $q->whereMonth('expense_date', $budget->fiscal_month))
            ->with('user')
            ->get()
            ->map(function ($e) {
                return [
                    'id' => $e->id,
                    'amount' => (float) $e->amount,
                    'date' => optional($e->expense_date)->toDateString(),
                    'user' => $e->user?->name ?? null,
                    'notes' => $e->notes ?? null,
                ];
            });

        return response()->json([
            'budget' => [
                'id' => $budget->id,
                'name' => $budget->name,
                'category' => $budget->category,
                'budgeted_amount' => (float) $budget->budgeted_amount,
                'spent' => (float) $budget->getTotalSpent(),
                'remaining' => (float) $budget->getRemainingBudget(),
                'percentageSpent' => (float) $budget->getPercentageSpent(),
            ],
            'expenses' => $expenses,
        ]);
    }
}
