<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Expense;
use App\Models\Budget;
use App\Models\ClientPayment;
use App\Models\IncentiveProfile;
use App\Models\IncentiveRecord;
use App\Models\User;
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

            $monthlyRevenue[] = (float) ClientPayment::where('year', $m->year)
                ->where('month', $m->month)
                ->sum('amount_paid');

            $monthlyExpenses[] = (float) Expense::whereYear('expense_date', $m->year)
                ->whereMonth('expense_date', $m->month)
                ->approved()
                ->sum('amount');
        }

        $recognizedRevenueYtd = (float) ClientPayment::where('year', now()->year)
            ->where('month', '<=', now()->month)
            ->sum('amount_paid');

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

        $invoicesCount = (int) Invoice::count();
        $avgInvoice = (float) (Invoice::avg('total_amount') ?? 0);
        $collectionRate = $invoicesSummary['total'] > 0 ? ($invoicesSummary['paid'] / $invoicesSummary['total']) : 0.0;
        $upcomingDue30 = (float) Invoice::whereIn('status', ['draft', 'sent', 'overdue'])
            ->whereBetween('due_date', [now(), now()->addDays(30)])
            ->sum('total_amount');
        $runRateExpenses = (float) (Expense::whereBetween('expense_date', [now()->subDays(30), now()])->sum('amount') / 30);
        $approvedExpensesCount = (int) Expense::approved()->count();
        $pendingExpensesCount = (int) Expense::pending()->count();

        $unpaid = Invoice::whereIn('status', ['draft', 'sent', 'overdue'])
            ->select('total_amount', 'due_date')
            ->get();
        $aging = [
            'current' => 0.0,
            'one_to_30' => 0.0,
            'thirty_one_to_60' => 0.0,
            'sixty_one_to_90' => 0.0,
            'over_90' => 0.0,
        ];
        $now = now();
        foreach ($unpaid as $inv) {
            if (! $inv->due_date || $inv->due_date >= $now) {
                $aging['current'] += (float) $inv->total_amount;
                continue;
            }
            $days = $inv->due_date->diffInDays($now);
            if ($days <= 30) {
                $aging['one_to_30'] += (float) $inv->total_amount;
            } elseif ($days <= 60) {
                $aging['thirty_one_to_60'] += (float) $inv->total_amount;
            } elseif ($days <= 90) {
                $aging['sixty_one_to_90'] += (float) $inv->total_amount;
            } else {
                $aging['over_90'] += (float) $inv->total_amount;
            }
        }

        $topCategories = Expense::approved()
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(function ($r) {
                return [
                    'category' => $r->category,
                    'total' => (float) $r->total,
                ];
            })->values();

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

        // My requisitions (current user)
        $myRequisitions = null;
        try {
            $me = auth()->user();
            if ($me) {
                $myRequisitions = [
                    'this_month_total' => (float) Expense::where('user_id', $me->id)
                        ->whereYear('expense_date', now()->year)
                        ->whereMonth('expense_date', now()->month)
                        ->sum('amount'),
                    'pending_count' => (int) Expense::where('user_id', $me->id)->pending()->count(),
                    'approved_count' => (int) Expense::where('user_id', $me->id)->approved()->count(),
                    'rejected_count' => (int) Expense::where('user_id', $me->id)->rejected()->count(),
                ];
            }
        } catch (\Throwable $e) {
            $myRequisitions = null;
        }

        // Last payroll run summary
        $lastPayroll = null;
        try {
            $pr = \App\Models\PayrollRun::orderByDesc('created_at')->first();
            if ($pr) {
                $lastPayroll = [
                    'id' => $pr->id,
                    'period_start' => optional($pr->period_start)->toDateString(),
                    'period_end' => optional($pr->period_end)->toDateString(),
                    'status' => $pr->status,
                    'gross_total' => (float) ($pr->gross_total ?? 0),
                    'net_total' => (float) ($pr->net_total ?? 0),
                ];
            }
        } catch (\Throwable $e) {
            $lastPayroll = null;
        }

        // Incentive summary for current month
        $year = now()->year;
        $month = now()->month;
        $incentiveSummary = [
            'total_supervisors' => User::role('supervisor')->count(),
            'total_sergeants' => User::role('sergeant')->count(),
            'active_profiles' => IncentiveProfile::where('is_active', true)->count(),
            'pending_count' => IncentiveRecord::forPeriod($year, $month)->where('status', 'pending')->count(),
            'approved_count' => IncentiveRecord::forPeriod($year, $month)->where('status', 'approved')->count(),
            'paid_count' => IncentiveRecord::forPeriod($year, $month)->where('status', 'paid')->count(),
            'total_paid_amount' => IncentiveRecord::forPeriod($year, $month)->where('status', 'paid')->sum('final_amount'),
            'pending_amount' => IncentiveRecord::forPeriod($year, $month)->where('status', 'pending')->sum('final_amount'),
            'by_role' => [
                'supervisor' => IncentiveRecord::forPeriod($year, $month)
                    ->whereHas('user.roles', fn($q) => $q->where('name', 'supervisor'))
                    ->sum('final_amount'),
                'sergeant' => IncentiveRecord::forPeriod($year, $month)
                    ->whereHas('user.roles', fn($q) => $q->where('name', 'sergeant'))
                    ->sum('final_amount'),
            ],
        ];

        return Inertia::render('Finance/Dashboard', [
            'invoicesSummary' => $invoicesSummary,
            'expensesSummary' => $expensesSummary,
            'months' => $months,
            'monthlyRevenue' => $monthlyRevenue,
            'monthlyExpenses' => $monthlyExpenses,
            'recognizedRevenueYtd' => $recognizedRevenueYtd,
            'budgets' => $budgets,
            'recent' => $recent,
            'kpis' => [
                'invoices_count' => $invoicesCount,
                'avg_invoice' => $avgInvoice,
                'collection_rate' => $collectionRate,
                'upcoming_due_30d' => $upcomingDue30,
                'expenses_run_rate_daily' => $runRateExpenses,
                'approved_expenses_count' => $approvedExpensesCount,
                'pending_expenses_count' => $pendingExpensesCount,
            ],
            'aging' => $aging,
            'topCategories' => $topCategories,
            'myRequisitions' => $myRequisitions,
            'lastPayroll' => $lastPayroll,
            'incentiveSummary' => $incentiveSummary,
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
