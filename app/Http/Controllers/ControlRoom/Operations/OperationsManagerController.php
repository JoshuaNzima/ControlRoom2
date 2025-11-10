<?php

namespace App\Http\Controllers\ControlRoom\Operations;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\Incident;
use App\Models\Flag;
use App\Models\Ticket;
use App\Models\ClientSite;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OperationsManagerController extends Controller
{
    public function __construct()
    {
        // Intentionally avoid enforcing route-level middleware here so routes can control access.
    }

    /**
     * Show the operations manager dashboard (higher-level aggregates).
     */
    public function index()
    {
        $stats = [
            'active_sites' => ClientSite::where('status', 'active')->count(),
            'total_guards' => Guard::count(),
            'active_alerts' => Alert::where('status', 'active')->count(),
            'pending_assignments' => GuardAssignment::where('is_active', false)->count(),
            'open_tickets' => Ticket::where('status', 'open')->count(),
        ];

        $reportSummary = [
            'incidents_last_7_days' => Incident::where('created_at', '>=', now()->subDays(7))->count(),
            'flags_last_7_days' => Flag::where('created_at', '>=', now()->subDays(7))->count(),
        ];

        $recentAlerts = Alert::orderBy('created_at', 'desc')->take(10)->get();

        return Inertia::render('ControlRoom/OperationsManager', [
            'stats' => $stats,
            'reportSummary' => $reportSummary,
            'recentAlerts' => $recentAlerts,
        ]);
    }

    /**
     * Show pending approvals that a manager can act on (assignments, shifts, etc.).
     */
    public function approvals()
    {
        $pendingAssignments = GuardAssignment::where('is_active', false)
            ->with(['guard', 'site'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('ControlRoom/OperationsManagerApprovals', [
            'pendingAssignments' => $pendingAssignments,
        ]);
    }

    /**
     * Simple report export endpoint (stub).
     */
    public function exportReports(Request $request)
    {
        $format = $request->get('format', 'csv');

        // For now return a JSON stub; in future this could stream a CSV/XLSX.
        $payload = [
            'stats' => [
                'active_sites' => ClientSite::where('status', 'active')->count(),
                'total_guards' => Guard::count(),
            ],
            'reportSummary' => [
                'incidents_last_7_days' => Incident::where('created_at', '>=', now()->subDays(7))->count(),
                'flags_last_7_days' => Flag::where('created_at', '>=', now()->subDays(7))->count(),
            ],
        ];

        return response()->json([
            'message' => 'Export (stub)',
            'format' => $format,
            'data' => $payload,
        ]);
    }
}
