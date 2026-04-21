<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use App\Models\GuardAssignment;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get guard record
        $guard = \App\Models\Guard::where('user_id', $user->id)->first();

        if (!$guard) {
            // Fallback for users without guard record
            return Inertia::render('Guards/Profile', [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar_url' => $user->avatar_path ? asset('storage/' . ltrim($user->avatar_path, '/')) : null,
                    'role' => 'guard',
                    'employee_id' => $user->id,
                    'created_at' => $user->created_at->toISOString(),
                ],
                'current_assignment' => null,
                'attendance' => [],
                'stats' => [
                    'days_worked_this_month' => 0,
                    'total_shifts' => 0,
                    'on_time_percentage' => 0,
                ],
            ]);
        }

        // Get current assignment
        $currentAssignment = GuardAssignment::where('guard_id', $guard->id)
            ->where('is_active', true)
            ->with(['site.client'])
            ->first();

        $assignmentData = null;
        if ($currentAssignment) {
            $assignmentData = [
                'id' => $currentAssignment->id,
                'site_name' => $currentAssignment->site?->name ?? 'Unknown',
                'client_name' => $currentAssignment->site?->client?->name ?? 'Unknown',
                'shift' => $currentAssignment->shift ?? 'Day',
                'status' => 'active',
                'start_date' => $currentAssignment->start_date->toISOString(),
            ];
        }

        // Get recent attendance
        $attendance = Attendance::where('guard_id', $guard->id)
            ->orderByDesc('date')
            ->limit(10)
            ->get(['id', 'date', 'status', 'check_in_time', 'check_out_time'])
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'date' => $record->date->toISOString(),
                    'status' => $record->status,
                    'check_in' => $record->check_in_time,
                    'check_out' => $record->check_out_time,
                ];
            });

        // Get stats for current month
        $startOfMonth = now()->startOfMonth();
        $attendancesThisMonth = Attendance::where('guard_id', $guard->id)
            ->where('date', '>=', $startOfMonth)
            ->get();

        $onTimeCount = $attendancesThisMonth->where('status', 'present')->count();
        $totalDays = $attendancesThisMonth->count();

        $stats = [
            'days_worked_this_month' => $attendancesThisMonth->whereIn('status', ['present', 'late'])->count(),
            'total_shifts' => GuardAssignment::where('guard_id', $guard->id)->count(),
            'on_time_percentage' => $totalDays > 0 ? round(($onTimeCount / $totalDays) * 100) : 0,
        ];

        return Inertia::render('Guards/Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar_url' => $user->avatar_path ? asset('storage/' . ltrim($user->avatar_path, '/')) : null,
                'role' => 'guard',
                'employee_id' => $guard->employee_id ?? $user->id,
                'created_at' => $user->created_at->toISOString(),
            ],
            'current_assignment' => $assignmentData,
            'attendance' => $attendance,
            'stats' => $stats,
        ]);
    }
}
