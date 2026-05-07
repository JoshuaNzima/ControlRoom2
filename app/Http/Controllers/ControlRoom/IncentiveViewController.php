<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\IncentiveEntry;
use App\Models\IncentiveType;
use App\Models\IncentiveRule;
use App\Models\SupervisorIncentiveProfile;
use App\Models\SupervisorIncentiveRecord;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Read-only incentive view controller for Control Room and Operations
 * Provides viewing access to incentive data without modification permissions
 */
class IncentiveViewController extends Controller
{
    /**
     * Main incentives dashboard - view only
     */
    public function index(Request $request): Response
    {
        $stats = [
            'incentive_system' => [
                'total_types' => IncentiveType::where('is_active', true)->count(),
                'total_rules' => IncentiveRule::where('is_active', true)->count(),
                'pending_entries' => IncentiveEntry::where('status', 'pending')->count(),
                'approved_entries' => IncentiveEntry::where('status', 'approved')->count(),
                'paid_entries' => IncentiveEntry::where('status', 'paid')->count(),
                'pending_amount' => IncentiveEntry::whereIn('status', ['pending', 'approved'])->sum('final_amount') ?? 0,
                'paid_amount_mtd' => IncentiveEntry::where('status', 'paid')
                    ->whereMonth('paid_at', now()->month)
                    ->sum('final_amount') ?? 0,
            ],
            'supervisor_incentives' => [
                'total_profiles' => SupervisorIncentiveProfile::where('is_active', true)->count(),
                'pending_calculations' => SupervisorIncentiveRecord::where('status', 'pending')->count(),
                'approved_pending_payment' => SupervisorIncentiveRecord::where('status', 'approved')->count(),
                'pending_amount_total' => SupervisorIncentiveRecord::whereIn('status', ['pending', 'approved'])
                    ->sum('net_amount') ?? 0,
            ],
        ];

        $recentEntries = IncentiveEntry::with(['guardRelation', 'incentiveType'])
            ->whereIn('status', ['pending', 'approved'])
            ->orderBy('calculated_at', 'desc')
            ->take(10)
            ->get();

        return Inertia::render('ControlRoom/Incentives/Index', [
            'stats' => $stats,
            'recentEntries' => $recentEntries,
            'viewOnly' => true,
        ]);
    }

    /**
     * View incentive entries with filtering
     */
    public function entries(Request $request): Response
    {
        $query = IncentiveEntry::with(['guardRelation', 'incentiveType', 'incentiveRule'])
            ->orderBy('calculated_at', 'desc');

        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('type_id') && $request->type_id) {
            $query->where('incentive_type_id', $request->type_id);
        }

        if ($request->has('period_start') && $request->period_start) {
            $query->where('period_start', '>=', $request->period_start);
        }

        if ($request->has('period_end') && $request->period_end) {
            $query->where('period_end', '<=', $request->period_end);
        }

        $entries = $query->paginate(20)->withQueryString();

        $types = IncentiveType::where('is_active', true)
            ->select('id', 'name', 'category')
            ->get();

        $statuses = ['pending', 'approved', 'rejected', 'paid'];

        return Inertia::render('ControlRoom/Incentives/Entries', [
            'entries' => $entries,
            'types' => $types,
            'statuses' => $statuses,
            'filters' => [
                'status' => $request->status ?? 'all',
                'type_id' => $request->type_id ?? null,
                'period_start' => $request->period_start ?? null,
                'period_end' => $request->period_end ?? null,
            ],
            'viewOnly' => true,
        ]);
    }

    /**
     * View supervisor incentives
     */
    public function supervisorIncentives(Request $request): Response
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $query = SupervisorIncentiveRecord::with(['guard', 'approver', 'payer'])
            ->where('year', $year)
            ->where('month', $month)
            ->orderBy('net_amount', 'desc');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $records = $query->paginate(20)->withQueryString();

        $stats = [
            'total_pending' => SupervisorIncentiveRecord::where('year', $year)
                ->where('month', $month)
                ->where('status', 'pending')
                ->count(),
            'total_approved' => SupervisorIncentiveRecord::where('year', $year)
                ->where('month', $month)
                ->where('status', 'approved')
                ->count(),
            'total_paid' => SupervisorIncentiveRecord::where('year', $year)
                ->where('month', $month)
                ->where('status', 'paid')
                ->count(),
            'pending_amount' => SupervisorIncentiveRecord::where('year', $year)
                ->where('month', $month)
                ->whereIn('status', ['pending', 'approved'])
                ->sum('net_amount') ?? 0,
        ];

        $profiles = SupervisorIncentiveProfile::where('is_active', true)
            ->with('guardRelation')
            ->get();

        return Inertia::render('ControlRoom/Incentives/Supervisor', [
            'records' => $records,
            'stats' => $stats,
            'profiles' => $profiles,
            'filters' => [
                'year' => $year,
                'month' => $month,
                'status' => $request->status ?? 'all',
            ],
            'viewOnly' => true,
        ]);
    }

    /**
     * API endpoint for incentive summary data (for dashboard widgets)
     */
    public function summary(): array
    {
        return [
            'incentive_system' => [
                'pending_count' => IncentiveEntry::where('status', 'pending')->count(),
                'pending_amount' => IncentiveEntry::whereIn('status', ['pending', 'approved'])->sum('final_amount') ?? 0,
                'paid_mtd' => IncentiveEntry::where('status', 'paid')
                    ->whereMonth('paid_at', now()->month)
                    ->sum('final_amount') ?? 0,
            ],
            'supervisor_incentives' => [
                'pending_count' => SupervisorIncentiveRecord::where('status', 'pending')->count(),
                'pending_amount' => SupervisorIncentiveRecord::whereIn('status', ['pending', 'approved'])->sum('net_amount') ?? 0,
            ],
        ];
    }
}
