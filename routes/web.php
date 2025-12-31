<?php

use App\Http\Controllers\InstallController;

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Guards\SupervisorController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\CounterController;
use App\Http\Controllers\SuperAdmin\SystemController;
use App\Models\Role;
// Installer routes
Route::middleware('web')->group(function () {
    Route::get('/install', [InstallController::class, 'welcome'])->name('install.welcome');
    Route::post('/install/check', [InstallController::class, 'check'])->name('install.check');
    Route::post('/install/config', [InstallController::class, 'configure'])->name('install.configure');
});

// Public landing page for guests (redirects authenticated users to dashboard)
Route::get('/', [\App\Http\Controllers\Public\LandingController::class, 'index'])->name('public.home');

// Public pages
Route::get('/contact', [\App\Http\Controllers\Public\ContactController::class, 'index'])->name('public.contact');
Route::post('/contact', [\App\Http\Controllers\Public\ContactController::class, 'store'])->name('public.contact.store');
Route::get('/services', [\App\Http\Controllers\Public\PageController::class, 'services'])->name('public.services');
Route::get('/services/{slug}', [\App\Http\Controllers\Public\PageController::class, 'service'])->name('public.services.show');
Route::get('/about', [\App\Http\Controllers\Public\PageController::class, 'about'])->name('public.about');
Route::get('/careers', [\App\Http\Controllers\Public\PageController::class, 'careers'])->name('public.careers');
Route::get('/privacy', [\App\Http\Controllers\Public\PageController::class, 'privacy'])->name('public.privacy');
// Public policies (guest)
Route::get('/policies', [\App\Http\Controllers\Public\PolicyController::class, 'index'])->name('public.policies.index');
Route::get('/policies/{slug}', [\App\Http\Controllers\Public\PolicyController::class, 'show'])->name('public.policies.show');

// Guest routes
Route::middleware('guest')->group(function () {
    Route::get('login', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'store']);
});

// Public intake endpoint (rate-limited)
Route::post('/intake', [\App\Http\Controllers\PublicIntakeController::class, 'store'])
    ->middleware('throttle:6,1')
    ->name('public.intake.store');

// Authenticated routes
Route::middleware('auth')->group(function () {
    Route::post('logout', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Notifications API
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.readAll');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');

    // Lightweight counters API for sidebar badges
    Route::get('/counters', [CounterController::class, 'index'])->name('counters.index');
});
Route::middleware(['auth', 'role:super_admin'])->prefix('superadmin')->name('superadmin.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\SuperAdmin\DashboardController::class, 'index'])->name('dashboard');
    Route::post('/modules/{module}/toggle', [\App\Http\Controllers\SuperAdmin\DashboardController::class, 'toggleModule'])->name('modules.toggle');
    Route::post('/cache/clear', [\App\Http\Controllers\SuperAdmin\DashboardController::class, 'clearCache'])->name('cache.clear');
    Route::post('/maintenance/enable', [\App\Http\Controllers\SuperAdmin\DashboardController::class, 'enableMaintenance'])->name('maintenance.enable');
    Route::post('/maintenance/disable', [\App\Http\Controllers\SuperAdmin\DashboardController::class, 'disableMaintenance'])->name('maintenance.disable');
    
    // Module Management
    Route::get('/modules', fn() => Inertia::render('SuperAdmin/Modules'))->name('modules');
    Route::get('/modules/{category}', fn($category) => Inertia::render('SuperAdmin/Modules', ['category' => $category]))->name('modules.category');
    // Module Index Pages
    Route::get('/finance', fn() => Inertia::render('SuperAdmin/Finance/Index'))->name('finance.index');
    Route::get('/finance/manage', fn() => Inertia::render('SuperAdmin/Finance/Manage'))->name('finance.manage');
    Route::get('/hr', fn() => Inertia::render('SuperAdmin/HR/Index'))->name('hr.index');
    Route::get('/hr/manage', fn() => Inertia::render('SuperAdmin/HR/Manage'))->name('hr.manage');
    Route::get('/clients', fn() => Inertia::render('SuperAdmin/Clients/Index'))->name('clients.index');
    Route::get('/clients/manage', function () {
        $perPage = (int) request('per_page', 20);
        $clients = \App\Models\Client::withCount(['sites', 'services'])
            ->when(request('search'), function ($q, $search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
        $services = \App\Models\Service::where('active', true)->orderBy('name')->get(['id','name','monthly_price']);
        $zones = \App\Models\Zone::orderBy('name')->get(['id','name']);
        return Inertia::render('SuperAdmin/Clients/Manage', [
            'clients' => $clients,
            'filters' => array_merge(request()->only(['search']), ['per_page' => $perPage]),
            'services' => $services,
            'zones' => $zones,
        ]);
    })->name('clients.manage');
    Route::get('/control-room', fn() => Inertia::render('SuperAdmin/ControlRoom/Index'))->name('control-room.index');
    Route::get('/control-room/manage', fn() => Inertia::render('SuperAdmin/ControlRoom/Manage'))->name('control-room.manage');
    Route::get('/assets', fn() => Inertia::render('SuperAdmin/Assets/Index'))->name('assets.index');
    Route::get('/assets/manage', fn() => Inertia::render('SuperAdmin/Assets/Manage'))->name('assets.manage');
    Route::get('/reports', fn() => Inertia::render('SuperAdmin/Reports/Index'))->name('reports.index');
    Route::get('/reports/manage', fn() => Inertia::render('SuperAdmin/Reports/Manage'))->name('reports.manage');
    
    // User Management (SuperAdmin UI, uses Admin endpoints under the hood)
    Route::get('/users', function () {
        $users = \App\Models\User::with('roles')
            ->when(request('search'), function($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(20);
        $roles = \Spatie\Permission\Models\Role::all();
        $zones = \App\Models\Zone::orderBy('name')->get(['id','name']);
        return Inertia::render('SuperAdmin/Users', [
            'users' => $users,
            'filters' => request()->only('search'),
            'roles' => $roles,
            'zones' => $zones,
        ]);
    })->name('users');

    // Guards Management (SuperAdmin UI)
    Route::get('/guards', function () {
        $perPage = (int) request('per_page', 20);
        $sort = in_array(request('sort'), ['name','employee_id','status','supervisor_id']) ? request('sort') : 'name';
        $dir = request('dir') === 'desc' ? 'desc' : 'asc';
        $guards = \App\Models\Guards\Guard::with('supervisor')
            ->when(request('search'), function($q, $search) {
                $q->where(function($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                       ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->when(request('status'), function($q, $status) {
                $q->where('status', $status);
            })
            ->when(request('zone_id'), function($q, $zoneId) {
                $q->where('zone_id', $zoneId);
            })
            ->when(request('grade_id'), function($q, $gradeId) {
                $q->where('guard_grade_id', $gradeId);
            })
            ->orderBy($sort, $dir)
            ->paginate($perPage)
            ->withQueryString();
        $supervisors = \App\Models\User::where('status', 'active')
            ->whereHas('roles', function ($q) {
                $q->whereIn('name', ['supervisor', 'manager', 'sergeant', 'zone_commander'])
                  ->where('guard_name', 'web');
            })
            ->orderBy('name')
            ->get(['id','name']);
        $grades = \App\Models\Guards\GuardGrade::orderBy('name')->get(['id','code','name']);
        $zones = \App\Models\Zone::orderBy('name')->get(['id','name']);
        return Inertia::render('SuperAdmin/Guards', [
            'guards' => $guards,
            'filters' => request()->only(['search','status','zone_id','grade_id','sort','dir','per_page']),
            'supervisors' => $supervisors,
            'grades' => $grades,
            'zones' => $zones,
        ]);
    })->name('guards');

    // Drivers Management (subset of Guards with employee_role=driver)
    Route::get('/drivers', function () {
        $perPage = (int) request('per_page', 20);
        $sort = in_array(request('sort'), ['name','employee_id','status','supervisor_id']) ? request('sort') : 'name';
        $dir = request('dir') === 'desc' ? 'desc' : 'asc';
        $guards = \App\Models\Guards\Guard::with('supervisor')
            ->where('employee_role', 'driver')
            ->when(request('search'), function($q, $search) {
                $q->where(function($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                       ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->when(request('status'), function($q, $status) {
                $q->where('status', $status);
            })
            ->when(request('zone_id'), function($q, $zoneId) {
                $q->where('zone_id', $zoneId);
            })
            ->orderBy($sort, $dir)
            ->paginate($perPage)
            ->withQueryString();
        $supervisors = \App\Models\User::where('status', 'active')
            ->whereHas('roles', function ($q) {
                $q->whereIn('name', ['supervisor', 'manager', 'sergeant', 'zone_commander'])
                  ->where('guard_name', 'web');
            })
            ->orderBy('name')
            ->get(['id','name']);
        $grades = \App\Models\Guards\GuardGrade::orderBy('name')->get(['id','code','name']);
        $zones = \App\Models\Zone::orderBy('name')->get(['id','name']);
        return Inertia::render('SuperAdmin/Drivers', [
            'guards' => $guards,
            'filters' => request()->only(['search','status','zone_id','sort','dir','per_page']),
            'supervisors' => $supervisors,
            'grades' => $grades,
            'zones' => $zones,
        ]);
    })->name('drivers');
    
    // System Settings
    Route::get('/settings', [\App\Http\Controllers\Admin\SettingController::class, 'superIndex'])->name('settings');
    Route::get('/security', fn() => Inertia::render('SuperAdmin/Security'))->name('security');
    Route::get('/backup', fn() => Inertia::render('SuperAdmin/Backup'))->name('backup');
    
    // System Monitoring
    Route::get('/logs', [SystemController::class, 'logsIndex'])->name('logs');
    Route::get('/logs/data', [SystemController::class, 'logsData'])->name('logs.data');
    Route::get('/logs/download', [SystemController::class, 'logsDownload'])->name('logs.download');
    Route::get('/audit', [SystemController::class, 'auditIndex'])->name('audit');
    Route::get('/audit/data', [SystemController::class, 'auditData'])->name('audit.data');
    Route::get('/maintenance', [SystemController::class, 'maintenanceIndex'])->name('maintenance');
    Route::get('/cache', fn() => Inertia::render('SuperAdmin/Cache'))->name('cache');
    
        Route::get('/roles', [App\Http\Controllers\SuperAdmin\RoleController::class, 'index'])->name('roles.index');
        Route::post('/roles', [App\Http\Controllers\SuperAdmin\RoleController::class, 'storeRole'])->name('roles.store');
        Route::delete('/roles/{role}', [App\Http\Controllers\SuperAdmin\RoleController::class, 'deleteRole'])->name('roles.delete');
    
        Route::post('/permissions', [App\Http\Controllers\SuperAdmin\RoleController::class, 'storePermission'])->name('permissions.store');
        Route::delete('/permissions/{permission}', [App\Http\Controllers\SuperAdmin\RoleController::class, 'deletePermission'])->name('permissions.delete');
    
        Route::post('/roles/{role}/toggle-permission', [App\Http\Controllers\SuperAdmin\RoleController::class, 'togglePermission'])->name('roles.togglePermission');
        Route::post('/roles/{role}/assign-user', [App\Http\Controllers\SuperAdmin\RoleController::class, 'assignUser'])->name('roles.assignUser');
        Route::post('/roles/{role}/remove-user', [App\Http\Controllers\SuperAdmin\RoleController::class, 'removeUser'])->name('roles.removeUser');

    // Backups
    Route::post('/backup/run', [SystemController::class, 'backupRun'])->name('backup.run');
    Route::get('/backups', [SystemController::class, 'backupsList'])->name('backups.list');
    Route::get('/backups/{file}/download', [SystemController::class, 'backupDownload'])->name('backups.download');
});

// Include all module routes
foreach (glob(__DIR__ . '/modules/*.php') as $routeFile) {
    require $routeFile;
}

Route::middleware(['auth'])->group(function () {

    Route::get('/dashboard', function() {
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }
        // Map dashboards using Spatie roles directly for accuracy
        if ($user->hasRole('super_admin')) {
            return redirect()->route('superadmin.dashboard');
        }
        if ($user->hasRole('admin')) {
            return redirect()->route('admin.dashboard');
        }
        if ($user->hasRole('operations_officer') || $user->hasRole('control_room_operator')) {
            return redirect()->route('control-room.dashboard');
        }
        if ($user->hasRole('zone_commander')) {
            return redirect()->route('zone.dashboard');
        }
        if ($user->hasRole('manager')) {
            return redirect()->route('manager.dashboard');
        }
        if ($user->hasAnyRole(['business_dev','business_development','bdo'])) {
            return redirect()->route('admin.business-dev');
        }
        if ($user->hasAnyRole(['marketing','marketing_officer','marketing_manager'])) {
            return redirect()->route('admin.marketing');
        }
        if ($user->hasAnyRole(['asset_manager','assets_manager'])) {
            return redirect()->route('assets.index');
        }
        if ($user->hasAnyRole(['supervisor','sergeant'])) {
            return redirect()->route('supervisor.dashboard');
        }
        if ($user->hasAnyRole(['hr','human_resources'])) {
            return redirect()->route('hr.dashboard');
        }
        if ($user->hasRole('client')) {
            return redirect()->route('client.dashboard');
        }
        if ($user->hasAnyRole(['finance_officer','accountant','finance','accounting'])) {
            return redirect()->route('finance.dashboard');
        }
        if ($user->hasAnyRole(['front_office','receptionist','client_service'])) {
            return redirect()->route('front-office.dashboard');
        }
        abort(403, 'Unauthorized. No dashboard is configured for your role.');
    
    })->name('dashboard');

    // Infractions routes - accessible by admin, zone commander, and supervisor
    Route::middleware(['auth'])->group(function () {
        Route::resource('infractions', \App\Http\Controllers\Guards\InfractionController::class)->except(['edit', 'update', 'destroy']);
        Route::get('infractions/{infraction}/review', [\App\Http\Controllers\Guards\InfractionController::class, 'review'])->name('infractions.review');
        Route::put('infractions/{infraction}/status', [\App\Http\Controllers\Guards\InfractionController::class, 'updateStatus'])->name('infractions.update-status');
    });

    // Zone Commander routes
    Route::middleware(['auth', 'role:zone_commander'])->prefix('zone')->name('zone.')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\ZoneCommander\DashboardController::class, 'index'])
            ->middleware('permission:zone.view.dashboard')
            ->name('dashboard');

        // Dashboard Data Routes
        Route::get('/data/weekly-attendance', [\App\Http\Controllers\ZoneCommander\AttendanceDataController::class, 'weeklyAttendance'])
            ->middleware('permission:zone.view.dashboard')
            ->name('data.weekly-attendance');
        Route::get('/data/risk-distribution', [\App\Http\Controllers\ZoneCommander\AttendanceDataController::class, 'riskDistribution'])
            ->middleware('permission:zone.view.dashboard')
            ->name('data.risk-distribution');

        // Quick Actions
        Route::get('/patrols/start', [\App\Http\Controllers\ZoneCommander\PatrolController::class, 'startPatrol'])
            ->middleware('permission:zone.patrols.scan')
            ->name('patrols.start');
        Route::get('/reports/generate', [\App\Http\Controllers\ZoneCommander\ReportController::class, 'generate'])
            ->middleware('permission:zone.reports.view')
            ->name('reports.generate');

        // Clients & Sites management
        Route::get('/clients', [\App\Http\Controllers\ZoneCommander\ClientsController::class, 'index'])
            ->middleware('permission:zone.view.clients')
            ->name('clients.index');
        Route::get('/sites', [\App\Http\Controllers\ZoneCommander\SiteController::class, 'index'])
            ->middleware('permission:zone.view.sites')
            ->name('sites.index');

        // Guards & Supervisors
        Route::get('/guards', [\App\Http\Controllers\ZoneCommander\GuardController::class, 'index'])
            ->middleware('permission:zone.view.guards')
            ->name('guards.index');
        Route::get('/supervisors', [\App\Http\Controllers\ZoneCommander\SupervisorController::class, 'index'])
            ->middleware('permission:zone.view.supervisors')
            ->name('supervisors.index');

        // Control-room scan tags viewer
        Route::get('/control-room/scan-tags', [\App\Http\Controllers\ControlRoom\ScanTagController::class, 'index'])
            ->middleware(['auth', 'permission:control-room.view'])
            ->name('control-room.scan-tags');

        // Patrols (checkpoint scans)
        Route::get('/patrols', [\App\Http\Controllers\ZoneCommander\PatrolController::class, 'index'])
            ->middleware('permission:zone.patrols.scan')
            ->name('patrols.index');
        Route::post('/patrols/scan', [\App\Http\Controllers\ZoneCommander\PatrolController::class, 'scan'])
            ->middleware('permission:zone.patrols.scan')
            ->name('patrols.scan');

        // Attendance fallback
        Route::get('/attendance', [\App\Http\Controllers\ZoneCommander\AttendanceController::class, 'index'])
            ->middleware('permission:zone.attendance.manage')
            ->name('attendance.index');
        Route::post('/attendance/check-in', [\App\Http\Controllers\ZoneCommander\AttendanceController::class, 'checkIn'])
            ->middleware('permission:zone.attendance.manage')
            ->name('attendance.check-in');
        Route::post('/attendance/check-out', [\App\Http\Controllers\ZoneCommander\AttendanceController::class, 'checkOut'])
            ->middleware('permission:zone.attendance.manage')
            ->name('attendance.check-out');

        // Downs lifecycle
        Route::get('/downs', [\App\Http\Controllers\ZoneCommander\DownController::class, 'index'])
            ->middleware('permission:zone.downs.manage')
            ->name('downs.index');
        Route::post('/downs', [\App\Http\Controllers\ZoneCommander\DownController::class, 'store'])
            ->middleware('permission:zone.downs.manage')
            ->name('downs.store');
        Route::post('/downs/{down}/escalate', [\App\Http\Controllers\ZoneCommander\DownController::class, 'escalate'])
            ->middleware('permission:zone.downs.manage')
            ->name('downs.escalate');
        Route::post('/downs/{down}/resolve', [\App\Http\Controllers\ZoneCommander\DownController::class, 'resolve'])
            ->middleware('permission:zone.downs.manage')
            ->name('downs.resolve');

        // Reports
        Route::get('/reports', [\App\Http\Controllers\ZoneCommander\ReportController::class, 'index'])
            ->middleware('permission:zone.reports.view')
            ->name('reports.index');
    });

    Route::middleware(['role:supervisor,manager,admin,super_admin'])->prefix('supervisor')->name('supervisor.')->group(function () {
        Route::get('/assignments', [\App\Http\Controllers\Guards\AssignmentController::class, 'index'])->name('assignments.index');
        Route::post('/assignments/assign', [\App\Http\Controllers\Guards\AssignmentController::class, 'assign'])->name('assignments.assign');
        Route::delete('/assignments/unassign/{assignment}', [\App\Http\Controllers\Guards\AssignmentController::class, 'unassign'])->name('assignments.unassign');
    });

    // Read-only Guards directory available to all authenticated users
    Route::get('/guards', [\App\Http\Controllers\Guards\DirectoryController::class, 'index'])->name('guards.index');
    Route::get('/guards/{guard}/json', [\App\Http\Controllers\Guards\DirectoryController::class, 'showJson'])->name('guards.json');

    Route::post('shifts/precheck', [\App\Http\Controllers\ShiftPrecheckController::class, 'precheck'])
        ->middleware(['role:supervisor'])
        ->name('shifts.precheck');

    // Client routes are now moved to the admin group
    
    // Admin Guard Assignments
    Route::get('/guard-assignments', [App\Http\Controllers\Admin\GuardAssignmentController::class, 'index'])->name('guard-assignments');
    Route::post('/guards/assign-supervisor', [App\Http\Controllers\Admin\GuardAssignmentController::class, 'assignToSupervisor'])->name('guards.assign-supervisor');
    Route::post('/guards/unassign-supervisor', [App\Http\Controllers\Admin\GuardAssignmentController::class, 'unassignFromSupervisor'])->name('guards.unassign-supervisor');
    
    // Admin User Management routes exist under the admin prefix in routes/modules/admin.php

    // Cross-module: One-time Expense Request (simple alias to Finance expense store)
    Route::get('/request/expense', function() {
        $categories = [
            'general', 'office_supplies', 'travel', 'meals', 'utilities', 'maintenance', 'marketing', 'equipment', 'other'
        ];
        return Inertia::render('Finance/Expenses/Request', [
            'categories' => $categories,
        ]);
    })->name('expense.request.create');
    Route::post('/request/expense', [\App\Http\Controllers\Finance\ExpenseController::class, 'store'])->name('expense.request.store');

    // Profile routes (edit/update/avatar)
    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [\App\Http\Controllers\ProfileController::class, 'updateAvatar'])->name('profile.avatar');

    // Profile dashboard (commissions, payroll summaries)
    Route::get('/me', [\App\Http\Controllers\Profile\ProfileDashboardController::class, 'index'])->name('profile.dashboard');
    Route::post('/me/commissions/{commission}/claim', [\App\Http\Controllers\Profile\ProfileDashboardController::class, 'claim'])->name('profile.commissions.claim');

});