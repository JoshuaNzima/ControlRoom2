<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use Inertia\Inertia;

class ReportsController extends Controller
{
    public function index()
    {
        $guards = Guard::query()
            ->select(['id','name'])
            ->orderBy('name')
            ->get();

        $sites = ClientSite::query()
            ->select(['id','name'])
            ->orderBy('name')
            ->get();

        $reportTypes = [
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

        return Inertia::render('ControlRoom/Reports/Index', [
            'reportTypes' => $reportTypes,
            'guards' => $guards,
            'sites' => $sites,
        ]);
    }
}
