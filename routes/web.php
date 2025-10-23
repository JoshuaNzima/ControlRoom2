<?php

use App\Http\Controllers\InstallController;

use Illuminate\Support\Facades\Route;
// Installer routes
Route::middleware('web')->group(function () {
    Route::get('/install', [InstallController::class, 'welcome'])->name('install.welcome');
    Route::post('/install/check', [InstallController::class, 'check'])->name('install.check');
    Route::post('/install/config', [InstallController::class, 'configure'])->name('install.configure');
});
use App\Http\Controllers\Guards\SupervisorController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\{DashboardController as AdminDashboard, UserController};
use App\Models\Role;
use Inertia\Inertia;

// Guest routes
Route::middleware('guest')->group(function () {
    Route::get('login', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'store']);
});

// Authenticated routes
Route::middleware('auth')->group(function () {
    Route::post('logout', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'destroy'])->name('logout');
    
    // Control Room routes (allow admins and users with permission)
    Route::middleware(['role_or_permission:admin|control_room_operator|supervisor|manager|control.dashboard.view'])->prefix('control-room')->name('control-room.')->group(function () {
        Route::get('/', [\App\Http\Controllers\ControlRoom\DashboardController::class, 'index'])->name('dashboard');
        
        // Ticket routes
        Route::resource('tickets', \App\Http\Controllers\ControlRoom\TicketController::class);
        Route::post('tickets/{ticket}/comments', [\App\Http\Controllers\ControlRoom\TicketController::class, 'addComment'])->name('tickets.comments.store');

        // Flag routes
        Route::resource('flags', \App\Http\Controllers\ControlRoom\FlagController::class);

        // Camera routes
        Route::resource('cameras', \App\Http\Controllers\ControlRoom\CameraController::class);
        Route::get('cameras/{camera}/recordings', [\App\Http\Controllers\ControlRoom\CameraController::class, 'getRecordings'])->name('cameras.recordings.index');
        Route::get('recordings/{recording}/download', [\App\Http\Controllers\ControlRoom\CameraController::class, 'downloadRecording'])->name('cameras.recordings.download');
        Route::post('cameras/{camera}/alerts/{alert}/acknowledge', [\App\Http\Controllers\ControlRoom\CameraController::class, 'acknowledgeAlert'])->name('cameras.alerts.acknowledge');
        Route::post('cameras/{camera}/alerts/{alert}/resolve', [\App\Http\Controllers\ControlRoom\CameraController::class, 'resolveAlert'])->name('cameras.alerts.resolve');
    });
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
});

// Include all module routes
foreach (glob(__DIR__ . '/modules/*.php') as $routeFile) {
    require $routeFile;
}

// Main authentication and dashboard routes
require __DIR__.'/auth.php';

Route::middleware(['auth'])->group(function () {

    Route::middleware(['role:admin,super_admin'])->prefix('admin')->name('admin.')->group(function(){
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    });

     Route::get('/', function() {
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
            case in_array('control_room_operator', $roles):
                return redirect()->route('control-room.dashboard');
            case in_array('zone_commander', $roles):
                return redirect()->route('zone.dashboard');
            case in_array('manager', $roles):
                return redirect()->route('manager.dashboard');
            case in_array('supervisor', $roles):
                return redirect()->route('supervisor.dashboard');
            case in_array('client', $roles):
                return redirect()->route('client.dashboard');
            default:
                return redirect()->route('login');
        }
    
    })->name('dashboard');

    // Admin Routes
    Route::middleware(['role:admin,super_admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AdminDashboard::class, 'index'])->name('dashboard');
        Route::resource('users', UserController::class);
        Route::get('/reports', [\App\Http\Controllers\Admin\ReportController::class, 'index'])->name('reports.index');
        Route::get('/modules', [\App\Http\Controllers\Admin\ModuleController::class, 'index'])->name('modules.index');
        Route::get('/settings', [\App\Http\Controllers\Admin\SettingController::class, 'index'])->name('settings.index');
    Route::resource('services', \App\Http\Controllers\Admin\ServiceController::class)->except(['show', 'create', 'edit']);
        Route::get('/qr-codes', [\App\Http\Controllers\SupervisorQRCodesController::class, 'index'])->name('qr-codes');
        Route::get('/qr-codes/download-bulk', [\App\Http\Controllers\SupervisorQRCodesController::class, 'downloadBulk'])->name('qr-codes.download-bulk');
    });

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

    // Supervisor Routes
    Route::middleware(['role:supervisor,manager,admin,super_admin'])->prefix('supervisor')->name('supervisor.')->group(function () {
        Route::get('/dashboard', [SupervisorController::class, 'dashboard'])->name('dashboard');
        Route::get('/guards', [SupervisorController::class, 'guards'])->name('guards');
        Route::get('/attendance', [SupervisorController::class, 'attendance'])->name('attendance');
        Route::get('/scanner', [SupervisorController::class, 'scanner'])->name('scanner');

        Route::get('/assignments', [\App\Http\Controllers\Guards\AssignmentController::class, 'index'])->name('assignments.index');
        Route::post('/assignments/assign', [\App\Http\Controllers\Guards\AssignmentController::class, 'assign'])->name('assignments.assign');
        Route::delete('/assignments/unassign/{assignment}', [\App\Http\Controllers\Guards\AssignmentController::class, 'unassign'])->name('assignments.unassign');
    });

    // Admin Guard Management
    Route::resource('guards', App\Http\Controllers\Admin\GuardController::class);
    
    // Admin Client Management
    Route::resource('clients', App\Http\Controllers\Admin\ClientController::class);
    // Update client services (custom prices on pivot)
    Route::post('clients/{client}/services', [App\Http\Controllers\Admin\ClientController::class, 'updateServices'])->name('clients.services.update');
    Route::get('clients/{client}/sites/create', [App\Http\Controllers\Admin\ClientController::class, 'createSite'])->name('clients.sites.create');
    Route::post('clients/{client}/sites', [App\Http\Controllers\Admin\ClientController::class, 'storeSite'])->name('clients.sites.store');
    
    // Admin Guard Assignments
    Route::get('/guard-assignments', [App\Http\Controllers\Admin\GuardAssignmentController::class, 'index'])->name('guard-assignments');
    Route::post('/guards/assign-supervisor', [App\Http\Controllers\Admin\GuardAssignmentController::class, 'assignToSupervisor'])->name('guards.assign-supervisor');
    Route::post('/guards/unassign-supervisor', [App\Http\Controllers\Admin\GuardAssignmentController::class, 'unassignFromSupervisor'])->name('guards.unassign-supervisor');
    
    // Admin User Management
    Route::resource('users', UserController::class);

    // Profile routes (edit/update/destroy)
    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [\App\Http\Controllers\ProfileController::class, 'destroy'])->name('profile.destroy');

});