<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class SupervisorDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $date = $request->input('date') ? Carbon::parse($request->input('date')) : today();

        // Dummy stats
        $stats = [
            'total_guards'      => 25,
            'present_today'     => 20,
            'on_duty'           => 15,
            'absent_today'      => 5,
            'relievers_count'   => 4,
            'shifts_today'      => 12,
            'completed_shifts'  => 8,
            'pending_reports'   => 3,
        ];

        // Dummy sites
        $sites = [
            ['id' => 1, 'name' => 'Site Alpha', 'client_name' => 'Client A', 'full_name' => 'Client A - Site Alpha'],
            ['id' => 2, 'name' => 'Site Beta', 'client_name' => 'Client B', 'full_name' => 'Client B - Site Beta'],
        ];

        // Dummy attendance trend (last 7 days)
        $attendanceTrend = collect(range(0, 6))->map(function ($i) {
            $d = now()->subDays(6 - $i)->toDateString();
            return [
                'date' => $d,
                'present' => rand(15, 25),
                'on_duty' => rand(10, 20),
                'absent' => rand(2, 8),
            ];
        });

        // Dummy shift stats
        $shiftStats = [
            ['type' => 'Morning', 'count' => 5],
            ['type' => 'Evening', 'count' => 4],
            ['type' => 'Night', 'count' => 3],
        ];

        // Dummy reliever trend
        $relieverTrend = collect(range(0, 6))->map(function ($i) {
            $d = now()->subDays(6 - $i)->toDateString();
            return [
                'date' => $d,
                'present' => rand(1, 5),
            ];
        });

        // Dummy reports trend
        $reportsTrend = collect(range(0, 6))->map(function ($i) {
            $d = now()->subDays(6 - $i)->toDateString();
            return [
                'date' => $d,
                'present' => rand(0, 4),
            ];
        });

        // Dummy recent reports
        $recentReports = [
            [
                'id' => 1,
                'guard_name' => 'John Doe',
                'site_name' => 'Site Alpha',
                'type' => 'Incident',
                'status' => 'Pending',
                'submitted_at' => now()->subHours(2)->format('Y-m-d H:i'),
            ],
            [
                'id' => 2,
                'guard_name' => 'Jane Smith',
                'site_name' => 'Site Beta',
                'type' => 'Shift',
                'status' => 'Reviewed',
                'submitted_at' => now()->subHours(5)->format('Y-m-d H:i'),
            ],
        ];

        // Dummy upcoming shifts
        $upcomingShifts = [
            [
                'id' => 1,
                'guard_name' => 'John Doe',
                'site_name' => 'Site Alpha',
                'type' => 'Morning',
                'start_time' => '08:00',
                'end_time' => '16:00',
            ],
            [
                'id' => 2,
                'guard_name' => 'Jane Smith',
                'site_name' => 'Site Beta',
                'type' => 'Night',
                'start_time' => '22:00',
                'end_time' => '06:00',
            ],
        ];

        // Dummy relievers on duty
        $relieversOnDuty = [
            [
                'id' => 1,
                'name' => 'Reliever One',
                'site_name' => 'Site Alpha',
                'on_duty' => true,
            ],
            [
                'id' => 2,
                'name' => 'Reliever Two',
                'site_name' => 'Site Beta',
                'on_duty' => true,
            ],
        ];

        return Inertia::render('Supervisor/Dashboard', [
            'stats' => $stats,
            'sites' => $sites,
            'currentDate' => $date->format('l, F j, Y'),
            'attendanceTrend' => $attendanceTrend,
            'selectedDate' => $date->toDateString(),
            'shiftStats' => $shiftStats,
            'relieverTrend' => $relieverTrend,
            'reportsTrend' => $reportsTrend,
            'recentReports' => $recentReports,
            'upcomingShifts' => $upcomingShifts,
            'relieversOnDuty' => $relieversOnDuty,
        ]);
    }
}
