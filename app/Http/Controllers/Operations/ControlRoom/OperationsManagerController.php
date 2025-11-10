<?php

namespace App\Http\Controllers\Operations\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\Guards\GuardAssignment;
use App\Services\Operations\DashboardStatsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class OperationsManagerController extends Controller
{
    protected $statsService;

    public function __construct(DashboardStatsService $statsService)
    {
        $this->statsService = $statsService;
    }

    /**
     * Show the operations manager dashboard (higher-level aggregates).
     */
    public function index(Request $request)
    {
        $stats = $this->statsService->getStats();
        $reportSummary = $this->statsService->getReportSummary();
        
        $recentAlerts = Alert::with(['site', 'assignedTo'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $recentActivity = Activity::causedBy(auth()->user())
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return Inertia::render('Operations/ControlRoom/OperationsManager', [
            'stats' => $stats,
            'reportSummary' => $reportSummary,
            'recentAlerts' => $recentAlerts,
            'recentActivity' => $recentActivity,
        ]);
    }

    /**
     * Show pending approvals that a manager can act on.
     */
    public function approvals(Request $request)
    {
        $query = GuardAssignment::with(['guard', 'site'])
            ->where('is_active', false)
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->has('site')) {
            $query->whereHas('site', function ($q) use ($request) {
                $q->where('id', $request->site);
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $assignments = $query->paginate(15);

        return Inertia::render('Operations/ControlRoom/Approvals', [
            'assignments' => $assignments,
        ]);
    }

    /**
     * Export reports in various formats
     */
    public function exportReports(Request $request)
    {
        $request->validate([
            'type' => 'required|in:incidents,flags,alerts',
            'format' => 'required|in:csv,xlsx,pdf',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        $fileName = sprintf(
            '%s_report_%s_%s.%s',
            $request->type,
            $request->date_from,
            $request->date_to,
            $request->format
        );

        activity()
            ->causedBy(auth()->user())
            ->log("Exported {$request->type} report");

        return Excel::download(
            new ReportsExport($request->all()),
            $fileName
        );
    }
}