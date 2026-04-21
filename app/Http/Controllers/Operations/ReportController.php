<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Guards\Attendance;
use App\Models\Incident;
use App\Models\Down;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

/**
 * Operations Report Controller
 * Provides operational reports for the operations team
 */
class ReportController extends Controller
{
    public function attendance(Request $request)
    {
        $date = $request->input('date', Carbon::today()->toDateString());

        $attendance = Attendance::with(['guard', 'site'])
            ->whereDate('date', $date)
            ->orderBy('check_in', 'desc')
            ->paginate(20);

        $stats = [
            'total' => Attendance::whereDate('date', $date)->count(),
            'checked_in' => Attendance::whereDate('date', $date)->whereNotNull('check_in')->count(),
            'checked_out' => Attendance::whereDate('date', $date)->whereNotNull('check_out')->count(),
            'absent' => Attendance::whereDate('date', $date)->where('status', 'absent')->count(),
        ];

        return Inertia::render('Operations/Reports/Attendance', [
            'attendance' => $attendance,
            'stats' => $stats,
            'date' => $date,
        ]);
    }

    public function deployments(Request $request)
    {
        return Inertia::render('Operations/Reports/Deployments', [
            'message' => 'Deployment reports coming soon',
        ]);
    }

    public function incidents(Request $request)
    {
        $incidents = Incident::with(['reporter', 'client', 'clientSite'])
            ->orderByDesc('created_at')
            ->paginate(20);

        $downs = Down::with(['reporter', 'client', 'site'])
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('Operations/Reports/Incidents', [
            'incidents' => $incidents,
            'downs' => $downs,
        ]);
    }
}
