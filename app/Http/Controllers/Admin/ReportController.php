<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Guards\{Guard, ClientSite};

class ReportController extends Controller
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

        $reportTypes = [
            ['id' => 'attendance', 'name' => 'Attendance Report'],
            ['id' => 'shifts', 'name' => 'Shifts Report'],
            ['id' => 'guard_performance', 'name' => 'Guard Performance'],
            ['id' => 'site_coverage', 'name' => 'Site Coverage'],
        ];

        return Inertia::render('Admin/Reports', [
            'reportTypes' => $reportTypes,
            'guards' => $guards,
            'sites' => $sites,
        ]);
    }
}
