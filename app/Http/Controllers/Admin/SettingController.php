<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SystemHealthService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index(SystemHealthService $systemHealthService)
    {
        $user = auth()->user();

        $system = [
            'database_status' => $systemHealthService->getDatabaseStatus(),
            'database_size' => $systemHealthService->getDatabaseSize(),
            'cache_size' => $systemHealthService->getCacheSize(),
            'storage_free' => $systemHealthService->getStorageFree(),
            'memory_usage' => $systemHealthService->getMemoryUsage(),
            'uptime' => $systemHealthService->getUptime(),
        ];

        // Finance settings payloads
        $payrollDefaults = [
            'guard_absence_deduction_per_day' => 0,
            'staff_absence_deduction_per_day' => 0,
            'overtime_multiplier_default' => 1.5,
        ];
        try {
            $row = \App\Models\Setting::where('key', 'finance.payroll.defaults')->first();
            if ($row && is_array($row->value)) {
                $payrollDefaults = array_merge($payrollDefaults, $row->value);
            }
        } catch (\Throwable $e) {}

        $guardGrades = [];
        try {
            $guardGrades = \App\Models\Guards\GuardGrade::orderBy('name')->get();
        } catch (\Throwable $e) {
            $guardGrades = [];
        }

        return Inertia::render('Admin/Settings/Index', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                ],
            ],
            'system' => $system,
            'payrollDefaults' => $payrollDefaults,
            'guardGrades' => $guardGrades,
        ]);
    }

    public function superIndex(SystemHealthService $systemHealthService)
    {
        $user = auth()->user();

        $system = [
            'database_status' => $systemHealthService->getDatabaseStatus(),
            'database_size' => $systemHealthService->getDatabaseSize(),
            'cache_size' => $systemHealthService->getCacheSize(),
            'storage_free' => $systemHealthService->getStorageFree(),
            'memory_usage' => $systemHealthService->getMemoryUsage(),
            'uptime' => $systemHealthService->getUptime(),
        ];

        $payrollDefaults = [
            'guard_absence_deduction_per_day' => 0,
            'staff_absence_deduction_per_day' => 0,
            'overtime_multiplier_default' => 1.5,
        ];
        try {
            $row = \App\Models\Setting::where('key', 'finance.payroll.defaults')->first();
            if ($row && is_array($row->value)) {
                $payrollDefaults = array_merge($payrollDefaults, $row->value);
            }
        } catch (\Throwable $e) {}

        $payProfiles = [];
        try {
            $payProfiles = \App\Models\PayProfile::orderBy('payee_type')->orderBy('payee_id')->get();
        } catch (\Throwable $e) {
            $payProfiles = [];
        }

        $guardGrades = [];
        try {
            $guardGrades = \App\Models\Guards\GuardGrade::orderBy('name')->get();
        } catch (\Throwable $e) {
            $guardGrades = [];
        }

		$attendanceMethods = [
			'auto_absent' => true,
			'auto_present' => false,
		];
		try {
			$row = \App\Models\Setting::where('key', 'attendance.methods')->first();
			if ($row && is_array($row->value)) {
				$attendanceMethods = array_merge($attendanceMethods, $row->value);
			}
		} catch (\Throwable $e) {}

        $guardOptions = [];
        $userOptions = [];
        try {
            $guardOptions = \App\Models\Guards\Guard::orderBy('name')
                ->get(['id', 'name', 'employee_id'])
                ->map(fn($g) => [
                    'id' => $g->id,
                    'label' => trim(($g->employee_id ? ($g->employee_id.' - ') : '') . $g->name),
                ]);
        } catch (\Throwable $e) {}
        try {
            $userOptions = \App\Models\User::orderBy('name')
                ->get(['id', 'name', 'employee_id', 'email'])
                ->map(fn($u) => [
                    'id' => $u->id,
                    'label' => trim(($u->employee_id ? ($u->employee_id.' - ') : '') . $u->name),
                ]);
        } catch (\Throwable $e) {}

        return Inertia::render('SuperAdmin/Settings', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                ],
            ],
            'system' => $system,
            'finance' => [
                'payrollDefaults' => $payrollDefaults,
                'payProfiles' => $payProfiles,
                'payeeOptions' => [
                    'guards' => $guardOptions,
                    'users' => $userOptions,
                ],
            ],
            'hr' => [
                'guardGrades' => $guardGrades,
            ],
			'attendance' => [
				'methods' => $attendanceMethods,
			],
        ]);
    }
}
