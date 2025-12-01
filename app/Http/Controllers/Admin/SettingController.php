<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SystemHealthService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Setting;
use Illuminate\Support\Facades\Mail;

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

        $payProfiles = [];
        try {
            $payProfiles = \App\Models\PayProfile::orderBy('payee_type')->orderBy('payee_id')->get();
        } catch (\Throwable $e) {
            $payProfiles = [];
        }

        // HR: Guard Grades
        $guardGrades = [];
        try {
            $guardGrades = \App\Models\Guards\GuardGrade::orderBy('name')->get();
        } catch (\Throwable $e) {
            $guardGrades = [];
        }

        // Payee options for searchable selectors
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

        // SMTP settings (no password returned)
        $mailDefaults = [
            'host' => '',
            'port' => 587,
            'encryption' => 'tls',
            'username' => '',
            'from_email' => '',
            'from_name' => '',
        ];
        $mailRow = null;
        try {
            $mailRow = Setting::where('key', 'mail.smtp')->first();
        } catch (\Throwable $e) {}
        $mail = $mailDefaults;
        if ($mailRow && is_array($mailRow->value)) {
            $mail = array_merge($mail, array_intersect_key($mailRow->value, $mailDefaults));
        }

        return Inertia::render('Admin/Settings', [
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

        // SMTP settings (no password returned)
        $mailDefaults = [
            'host' => '',
            'port' => 587,
            'encryption' => 'tls',
            'username' => '',
            'from_email' => '',
            'from_name' => '',
        ];
        $mailRow = null;
        try {
            $mailRow = Setting::where('key', 'mail.smtp')->first();
        } catch (\Throwable $e) {}
        $mail = $mailDefaults;
        if ($mailRow && is_array($mailRow->value)) {
            $mail = array_merge($mail, array_intersect_key($mailRow->value, $mailDefaults));
        }

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
                // omit pay profiles to keep payload small in super settings view
            ],
            'hr' => [
                'guardGrades' => $guardGrades,
            ],
            'mail' => $mail,
        ]);
    }

    public function updateMail(Request $request)
    {
        $validated = $request->validate([
            'host' => 'required|string',
            'port' => 'required|integer|min:1',
            'encryption' => 'nullable|string|in:tls,ssl,none',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
            'from_email' => 'nullable|email',
            'from_name' => 'nullable|string',
        ]);

        $row = Setting::firstOrNew(['key' => 'mail.smtp']);
        $current = is_array($row->value) ? $row->value : [];
        $next = array_merge($current, [
            'host' => $validated['host'],
            'port' => (int) $validated['port'],
            'encryption' => ($validated['encryption'] ?? null) === 'none' ? null : ($validated['encryption'] ?? null),
            'username' => $validated['username'] ?? '',
            'from_email' => $validated['from_email'] ?? '',
            'from_name' => $validated['from_name'] ?? '',
        ]);
        if (!empty($validated['password'])) {
            $next['password'] = $validated['password'];
        }
        $row->value = $next;
        $row->module = 'system';
        $row->save();

        return back()->withSuccess('SMTP settings saved.');
    }

    public function testMail(Request $request)
    {
        $data = $request->validate([
            'to' => 'required|email',
        ]);

        try {
            // Apply saved SMTP just for this test send
            try {
                $row = Setting::where('key', 'mail.smtp')->first();
                if ($row && is_array($row->value)) {
                    $smtp = $row->value;
                    $enc = $smtp['encryption'] ?? null;
                    config([
                        'mail.default' => config('mail.default', 'smtp'),
                        'mail.mailers.smtp.host' => $smtp['host'] ?? config('mail.mailers.smtp.host'),
                        'mail.mailers.smtp.port' => $smtp['port'] ?? config('mail.mailers.smtp.port'),
                        'mail.mailers.smtp.encryption' => $enc ?: null,
                        'mail.mailers.smtp.username' => $smtp['username'] ?? config('mail.mailers.smtp.username'),
                        'mail.mailers.smtp.password' => $smtp['password'] ?? config('mail.mailers.smtp.password'),
                        'mail.from.address' => $smtp['from_email'] ?? config('mail.from.address'),
                        'mail.from.name' => $smtp['from_name'] ?? config('mail.from.name'),
                    ]);
                }
            } catch (\Throwable $e) {}
            Mail::raw('This is a test email from ControlRoom SMTP settings.', function ($message) use ($data) {
                $message->to($data['to'])->subject('SMTP Test - ControlRoom');
            });
            return back()->withSuccess('Test email sent to '.$data['to']);
        } catch (\Throwable $e) {
            return back()->withError('Failed to send test email: '.$e->getMessage());
        }
    }
}
