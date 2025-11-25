<?php

use App\Http\Controllers\InstallController;

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Guards\SupervisorController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\{DashboardController as AdminDashboard, UserController};
use App\Models\Role;
// Installer routes
Route::middleware('web')->group(function () {
    Route::get('/install', [InstallController::class, 'welcome'])->name('install.welcome');
    Route::post('/install/check', [InstallController::class, 'check'])->name('install.check');
    Route::post('/install/config', [InstallController::class, 'configure'])->name('install.configure');
});

// Public landing page for guests (redirects authenticated users to dashboard)
Route::get('/', [\App\Http\Controllers\Public\LandingController::class, 'index'])->name('public.home');

// Public contact page
Route::get('/contact', [\App\Http\Controllers\Public\ContactController::class, 'index'])->name('public.contact');
Route::post('/contact', [\App\Http\Controllers\Public\ContactController::class, 'store'])->name('public.contact.store');

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
    
    // User Management
    Route::get('/users', fn() => Inertia::render('SuperAdmin/Users'))->name('users');
    
    // System Settings
    Route::get('/settings', fn() => Inertia::render('SuperAdmin/Settings'))->name('settings');
    Route::get('/security', fn() => Inertia::render('SuperAdmin/Security'))->name('security');
    Route::get('/backup', fn() => Inertia::render('SuperAdmin/Backup'))->name('backup');
    
    // System Monitoring
    Route::get('/logs', fn() => Inertia::render('SuperAdmin/Logs'))->name('logs');
    Route::get('/audit', fn() => Inertia::render('SuperAdmin/Audit'))->name('audit');
    Route::get('/maintenance', fn() => Inertia::render('SuperAdmin/Maintenance'))->name('maintenance');
    Route::get('/cache', fn() => Inertia::render('SuperAdmin/Cache'))->name('cache');
    
        Route::get('/roles', [App\Http\Controllers\SuperAdmin\RoleController::class, 'index'])->name('roles.index');
        Route::post('/roles', [App\Http\Controllers\SuperAdmin\RoleController::class, 'storeRole'])->name('roles.store');
        Route::delete('/roles/{role}', [App\Http\Controllers\SuperAdmin\RoleController::class, 'deleteRole'])->name('roles.delete');
    
        Route::post('/permissions', [App\Http\Controllers\SuperAdmin\RoleController::class, 'storePermission'])->name('permissions.store');
        Route::delete('/permissions/{permission}', [App\Http\Controllers\SuperAdmin\RoleController::class, 'deletePermission'])->name('permissions.delete');
    
        Route::post('/roles/{role}/toggle-permission', [App\Http\Controllers\SuperAdmin\RoleController::class, 'togglePermission'])->name('roles.togglePermission');
        Route::post('/roles/{role}/assign-user', [App\Http\Controllers\SuperAdmin\RoleController::class, 'assignUser'])->name('roles.assignUser');
        Route::post('/roles/{role}/remove-user', [App\Http\Controllers\SuperAdmin\RoleController::class, 'removeUser'])->name('roles.removeUser');
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
        
        $roles = Role::whereHas('users', function($query) use ($user) {
            $query->where('model_id', $user->id);
        })->pluck('name')->toArray();
        
        switch(true) {
            case in_array('super_admin', $roles):
                return redirect()->route('superadmin.dashboard');
            case in_array('admin', $roles):
                return redirect()->route('admin.dashboard');
            case in_array('operations_officer', $roles):
                return redirect()->route('control-room.dashboard');
            case in_array('control_room_operator', $roles):
                return redirect()->route('control-room.dashboard');
            case in_array('zone_commander', $roles):
                return redirect()->route('zone.dashboard');
            case in_array('manager', $roles):
                return redirect()->route('manager.dashboard');
            case in_array('business_dev', $roles):
            case in_array('business_development', $roles):
            case in_array('bdo', $roles):
                return redirect()->route('admin.business-dev');
            case in_array('marketing', $roles):
            case in_array('marketing_officer', $roles):
            case in_array('marketing_manager', $roles):
                return redirect()->route('admin.marketing');
            case in_array('supervisor', $roles):
                return redirect()->route('supervisor.dashboard');
            case in_array('sergeant', $roles):
                return redirect()->route('supervisor.dashboard');
            case in_array('hr', $roles):
            case in_array('human_resources', $roles):
                return redirect()->route('hr.dashboard');
            case in_array('client', $roles):
                return redirect()->route('client.dashboard');
            case in_array('finance_officer', $roles):
            case in_array('accountant', $roles):
                return redirect()->route('finance.dashboard');
            case in_array('finance', $roles):
            case in_array('accounting', $roles):
                return redirect()->route('finance.dashboard');
            default:
                abort(403, 'Unauthorized. No dashboard is configured for your role.');
        }
    
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

    // Client routes are now moved to the admin group
    
    // Admin Guard Assignments
    Route::get('/guard-assignments', [App\Http\Controllers\Admin\GuardAssignmentController::class, 'index'])->name('guard-assignments');
    Route::post('/guards/assign-supervisor', [App\Http\Controllers\Admin\GuardAssignmentController::class, 'assignToSupervisor'])->name('guards.assign-supervisor');
    Route::post('/guards/unassign-supervisor', [App\Http\Controllers\Admin\GuardAssignmentController::class, 'unassignFromSupervisor'])->name('guards.unassign-supervisor');
    
    // Admin User Management
    Route::resource('users', UserController::class);

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

    // Profile routes (edit/update/destroy)
    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [\App\Http\Controllers\ProfileController::class, 'destroy'])->name('profile.destroy');

});