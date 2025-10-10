<?php

namespace App\Http\Controllers;

use App\Models\Guards\{Guard, Shift, Attendance, ClientSite};
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ReportsController extends Controller
{
    public function index()
    {
        $guards = Guard::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();

        $sites = ClientSite::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Reports/Index', [
            'reportTypes' => $this->getAvailableReports(),
            'guards' => $guards,
            'sites' => $sites,
        ]);
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'guard_id' => 'nullable|exists:guards,id',
            'site_id' => 'nullable|exists:client_sites,id',
        ]);

        $data = match($validated['type']) {
            'attendance' => $this->generateAttendanceReport($validated),
            'shifts' => $this->generateShiftsReport($validated),
            'guard_performance' => $this->generateGuardPerformanceReport($validated),
            'site_coverage' => $this->generateSiteCoverageReport($validated),
            default => throw new \Exception('Invalid report type'),
        };

        return response()->json($data);
    }

    private function generateAttendanceReport($params)
    {
        $query = Attendance::with(['guardRelation', 'clientSite'])
            ->whereBetween('date', [$params['start_date'], $params['end_date']]);

        if (Auth::user()->hasRole('supervisor')) {
            $query->whereHas('guardRelation', function($q) {
                $q->forSupervisor(Auth::id());
            });
        }

        if (isset($params['guard_id'])) {
            $query->where('guard_id', $params['guard_id']);
        }

        if (isset($params['site_id'])) {
            $query->where('client_site_id', $params['site_id']);
        }

        return $query->get()->map(function($attendance) {
            return [
                'date' => $attendance->date->format('Y-m-d'),
                'guard_name' => $attendance->guardRelation->name,
                'site_name' => $attendance->clientSite->name,
                'check_in' => $attendance->check_in_time?->format('H:i'),
                'check_out' => $attendance->check_out_time?->format('H:i'),
                'hours_worked' => $attendance->hours_worked,
                'status' => $attendance->status,
            ];
        });
    }

    private function generateShiftsReport($params)
    {
        $query = Shift::with(['guardRelation', 'clientSite'])
            ->whereBetween('date', [$params['start_date'], $params['end_date']]);

        if (Auth::user()->hasRole('supervisor')) {
            $query->whereHas('guardRelation', function($q) {
                $q->forSupervisor(Auth::id());
            });
        }

        if (isset($params['guard_id'])) {
            $query->where('guard_id', $params['guard_id']);
        }

        if (isset($params['site_id'])) {
            $query->where('client_site_id', $params['site_id']);
        }

        return $query->get()->map(function($shift) {
            return [
                'date' => $shift->date->format('Y-m-d'),
                'guard_name' => $shift->guardRelation->name,
                'site_name' => $shift->clientSite->name,
                'shift_type' => $shift->shift_type,
                'start_time' => $shift->start_time->format('H:i'),
                'end_time' => $shift->end_time->format('H:i'),
                'duration' => $shift->duration,
                'status' => $shift->status,
            ];
        });
    }

    private function generateGuardPerformanceReport($params)
    {
        $query = Guard::with(['attendance' => function($q) use ($params) {
            $q->whereBetween('date', [$params['start_date'], $params['end_date']]);
        }]);

        if (Auth::user()->hasRole('supervisor')) {
            $query->forSupervisor(Auth::id());
        }

        if (isset($params['guard_id'])) {
            $query->where('id', $params['guard_id']);
        }

        return $query->get()->map(function($guard) {
            $totalShifts = $guard->attendance->count();
            $onTimeShifts = $guard->attendance->where('status', 'on_time')->count();
            $lateShifts = $guard->attendance->where('status', 'late')->count();
            $absentShifts = $guard->attendance->where('status', 'absent')->count();

            return [
                'guard_name' => $guard->name,
                'total_shifts' => $totalShifts,
                'on_time_shifts' => $onTimeShifts,
                'late_shifts' => $lateShifts,
                'absent_shifts' => $absentShifts,
                'attendance_rate' => $totalShifts > 0 ? round(($onTimeShifts / $totalShifts) * 100, 2) : 0,
                'average_hours' => $guard->attendance->avg('hours_worked') ?? 0,
            ];
        });
    }

    private function generateSiteCoverageReport($params)
    {
        $query = ClientSite::with(['shifts' => function($q) use ($params) {
            $q->whereBetween('date', [$params['start_date'], $params['end_date']]);
        }]);

        if (isset($params['site_id'])) {
            $query->where('id', $params['site_id']);
        }

        return $query->get()->map(function($site) {
            $totalShifts = $site->shifts->count();
            $completedShifts = $site->shifts->where('status', 'completed')->count();
            $cancelledShifts = $site->shifts->where('status', 'cancelled')->count();

            return [
                'site_name' => $site->name,
                'total_shifts' => $totalShifts,
                'completed_shifts' => $completedShifts,
                'cancelled_shifts' => $cancelledShifts,
                'coverage_rate' => $totalShifts > 0 ? round(($completedShifts / $totalShifts) * 100, 2) : 0,
                'average_shifts_per_day' => $site->shifts->groupBy('date')->count() > 0 
                    ? round($totalShifts / $site->shifts->groupBy('date')->count(), 2) 
                    : 0,
            ];
        });
    }

    private function getAvailableReports()
    {
        return [
            [
                'id' => 'attendance',
                'name' => 'Attendance Report',
                'description' => 'Daily attendance records including check-in/out times and hours worked',
            ],
            [
                'id' => 'shifts',
                'name' => 'Shifts Report',
                'description' => 'Detailed shift assignments and completion status',
            ],
            [
                'id' => 'guard_performance',
                'name' => 'Guard Performance Report',
                'description' => 'Individual guard performance metrics including attendance rates and punctuality',
            ],
            [
                'id' => 'site_coverage',
                'name' => 'Site Coverage Report',
                'description' => 'Site-wise shift coverage and guard allocation analysis',
            ],
        ];
    }
}