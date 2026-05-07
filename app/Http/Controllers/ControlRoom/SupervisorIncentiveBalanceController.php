<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Services\SupervisorIncentiveBalanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller for supervisor/sergeant incentive balance views
 */
class SupervisorIncentiveBalanceController extends Controller
{
    protected SupervisorIncentiveBalanceService $service;

    public function __construct(SupervisorIncentiveBalanceService $service)
    {
        $this->service = $service;
    }

    /**
     * Show the current user's incentive balance
     */
    public function myBalance(Request $request): Response
    {
        $user = Auth::user();
        
        // Find the guard record for this user (if they are a supervisor/sergeant)
        $guard = \App\Models\Guards\Guard::where('user_id', $user->id)
            ->orWhere('id', $user->guard_id ?? 0)
            ->first();

        if (!$guard) {
            return Inertia::render('ControlRoom/Incentives/SupervisorBalance', [
                'balance' => null,
                'recentDeductions' => [],
                'pendingDowns' => ['count' => 0, 'potential_deduction' => 0, 'downs' => []],
                'message' => 'No supervisor/sergeant record found for your account.',
            ]);
        }

        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        // Get or create balance for this month
        $balance = $this->service->getOrCreateBalance($guard->id, $year, $month);

        // Load deductions
        $recentDeductions = $balance->deductions()
            ->with('resolver')
            ->orderBy('deducted_at', 'desc')
            ->take(10)
            ->get()
            ->map(fn($d) => [
                'id' => $d->id,
                'deduction_amount' => $d->deduction_amount,
                'reason' => $d->reason,
                'resolution_type' => $d->resolution_type,
                'deducted_at' => $d->deducted_at,
            ]);

        // Get pending downs
        $pendingDowns = $this->service->getPendingDownsForSupervisor($guard->id);

        // Format pending downs for frontend
        $formattedPendingDowns = [
            'count' => $pendingDowns['count'],
            'potential_deduction' => $pendingDowns['potential_deduction'],
            'downs' => collect($pendingDowns['downs'])->map(fn($d) => [
                'id' => $d->id,
                'title' => $d->title,
                'type' => $d->type,
                'guard' => $d->guard ? ['name' => $d->guard->name] : null,
                'site' => $d->site ? ['name' => $d->site->name] : null,
                'created_at' => $d->created_at,
                'potential_deduction' => $d->incentive_deduction_amount ?? 5000.00,
            ]),
        ];

        return Inertia::render('ControlRoom/Incentives/SupervisorBalance', [
            'balance' => [
                'guard_id' => $balance->guard_id,
                'year' => $balance->year,
                'month' => $balance->month,
                'base_amount' => $balance->base_amount,
                'current_balance' => $balance->current_balance,
                'total_deductions' => $balance->total_deductions,
                'deduction_count' => $balance->deductions()->count(),
                'status' => $balance->status,
                'disbursed_amount' => $balance->final_disbursed_amount,
            ],
            'recentDeductions' => $recentDeductions,
            'pendingDowns' => $formattedPendingDowns,
            'periodLabel' => $periodLabel,
        ]);
    }

    /**
     * Show balances for all supervisors (for control room view)
     */
    public function index(Request $request): Response
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $balances = \App\Models\SupervisorIncentiveBalance::forPeriod($year, $month)
            ->with('guardRelation')
            ->orderByDesc('current_balance')
            ->paginate(20);

        $totalBase = \App\Models\SupervisorIncentiveBalance::forPeriod($year, $month)->sum('base_amount');
        $totalDeductions = \App\Models\SupervisorIncentiveBalance::forPeriod($year, $month)->sum('total_deductions');
        $totalPending = \App\Models\SupervisorIncentiveBalance::forPeriod($year, $month)
            ->where('status', 'active')
            ->sum('current_balance');

        return Inertia::render('ControlRoom/Incentives/SupervisorBalancesIndex', [
            'balances' => $balances,
            'summary' => [
                'total_base' => $totalBase,
                'total_deductions' => $totalDeductions,
                'total_pending_disbursement' => $totalPending,
                'supervisor_count' => $balances->total(),
            ],
            'filters' => [
                'year' => $year,
                'month' => $month,
            ],
            'periodLabel' => $periodLabel,
        ]);
    }
}
