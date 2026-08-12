<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Expense;
use App\Models\Budget;
use App\Models\ClientPayment;
use App\Models\Approval;
use App\Models\Guards\Client;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class FinanceController extends Controller
{
    public function index()
    {
        $now = now();

        // Invoices summary
        $invoicesSummary = [
            'total' => (float) Invoice::sum('total_amount'),
            'paid' => (float) Invoice::paid()->sum('total_amount'),
            'unpaid' => (float) Invoice::unpaid()->sum('total_amount'),
            'overdue_count' => (int) Invoice::overdue()->count(),
            'overdue_amount' => (float) Invoice::overdue()->sum('total_amount'),
        ];

        // Expenses summary
        $expensesSummary = [
            'total' => (float) Expense::sum('amount'),
            'approved' => (float) Expense::approved()->sum('amount'),
            'pending' => (float) Expense::pending()->sum('amount'),
        ];

        $netCashflow = $invoicesSummary['paid'] - $expensesSummary['approved'];

        $recognizedRevenueYtd = 0.0;
        try {
            $recognizedRevenueYtd = (float) ClientPayment::where('year', $now->year)
                ->where('month', '<=', $now->month)
                ->sum('amount_paid');
        } catch (\Throwable $e) {
            $recognizedRevenueYtd = 0.0;
        }

        // Budgets summary (only active budgets)
        $activeBudgets = Budget::active()->get();
        $budgetsSummary = [
            'active_count' => $activeBudgets->count(),
            'total_budgeted' => (float) $activeBudgets->sum('budgeted_amount'),
            'exceeded_count' => $activeBudgets->filter(fn (Budget $b) => $b->isExceeded())->count(),
            'critical_count' => $activeBudgets->filter(function (Budget $b) {
                if ($b->isExceeded()) {
                    return false;
                }
                return $b->getPercentageSpent() >= 80;
            })->count(),
        ];

        // Payments summary for current year (mirror Admin dashboard logic)
        $paymentsSummary = [
            'total_clients' => (int) Client::count(),
            'clients_with_outstanding' => 0,
            'outstanding_value' => 0.0,
        ];

        try {
            $year = $now->year;
            $clientPayments = ClientPayment::where('year', $year)->get();
            $grouped = $clientPayments->groupBy('client_id');
            foreach ($grouped as $rows) {
                $due = (float) $rows->sum('amount_due');
                $paid = (float) $rows->sum('amount_paid');
                if ($due > $paid) {
                    $paymentsSummary['clients_with_outstanding']++;
                    $paymentsSummary['outstanding_value'] += ($due - $paid);
                }
            }
            $paymentsSummary['outstanding_value'] = round($paymentsSummary['outstanding_value'], 2);
        } catch (\Throwable $e) {
            // Table may not exist in early setups; fail soft
        }

        // Approvals summary
        $approvalsSummary = [
            'pending' => (int) Approval::where('status', 'pending')->count(),
            'approved_today' => (int) Approval::where('status', 'approved')
                ->whereDate('updated_at', $now->toDateString())
                ->count(),
        ];

        // Simple MTD trend for revenue & expenses (last 6 months)
        $months = [];
        $revenueSeries = [];
        $expenseSeries = [];
        $start = $now->copy()->subMonths(5)->startOfMonth();

        for ($i = 0; $i < 6; $i++) {
            $m = $start->copy()->addMonths($i);
            $label = $m->format('M Y');
            $months[] = $label;

            $revenueSeries[] = (float) ClientPayment::where('year', $m->year)
                ->where('month', $m->month)
                ->sum('amount_paid');

            $expenseSeries[] = (float) Expense::whereYear('expense_date', $m->year)
                ->whereMonth('expense_date', $m->month)
                ->approved()
                ->sum('amount');
        }

        return Inertia::render('Admin/Finance', [
            'invoicesSummary' => $invoicesSummary,
            'expensesSummary' => $expensesSummary,
            'netCashflow' => $netCashflow,
            'budgetsSummary' => $budgetsSummary,
            'paymentsSummary' => $paymentsSummary,
            'approvalsSummary' => $approvalsSummary,
            'months' => $months,
            'revenueSeries' => $revenueSeries,
            'expenseSeries' => $expenseSeries,
            'recognizedRevenueYtd' => $recognizedRevenueYtd,
            'auth' => [
                'user' => [
                    'name' => auth()->user()->name,
                    'roles' => auth()->user()->roles ?? ['admin'],
                    'permissions' => auth()->user()->permissions ?? [],
                ],
            ],
        ]);
    }
}
