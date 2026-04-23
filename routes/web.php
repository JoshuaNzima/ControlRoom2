<?php

use App\Http\Controllers\InstallController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\CounterController;
use App\Http\Controllers\SuperAdmin\SystemController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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
// Public apply endpoint for a specific job posting
Route::post('/careers/{jobPosting}/apply', [\App\Http\Controllers\Public\JobApplicationController::class, 'store'])
    ->middleware('throttle:6,1')
    ->name('public.careers.apply');
Route::get('/privacy', [\App\Http\Controllers\Public\PageController::class, 'privacy'])->name('public.privacy');
// Public policies (guest)
Route::get('/policies', [\App\Http\Controllers\Public\PolicyController::class, 'index'])->name('public.policies.index');
Route::get('/policies/{slug}', [\App\Http\Controllers\Public\PolicyController::class, 'show'])->name('public.policies.show');

// Guest routes
Route::middleware('guest')->group(function () {
    Route::get('register', [\App\Http\Controllers\Auth\RegisteredUserController::class, 'create'])->name('register');
    Route::post('register', [\App\Http\Controllers\Auth\RegisteredUserController::class, 'store']);

    Route::get('login', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'store']);

    // Password reset
    Route::get('forgot-password', [\App\Http\Controllers\Auth\PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('forgot-password', [\App\Http\Controllers\Auth\PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::get('reset-password/{token}', [\App\Http\Controllers\Auth\NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('reset-password', [\App\Http\Controllers\Auth\NewPasswordController::class, 'store'])->name('password.store');
});

// Public intake endpoint (rate-limited)
Route::post('/intake', [\App\Http\Controllers\PublicIntakeController::class, 'store'])
    ->middleware('throttle:6,1')
    ->name('public.intake.store');

// Authenticated routes
Route::middleware('auth')->group(function () {
    Route::post('logout', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('verify-email', \App\Http\Controllers\Auth\EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', \App\Http\Controllers\Auth\VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [\App\Http\Controllers\Auth\EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [\App\Http\Controllers\Auth\ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [\App\Http\Controllers\Auth\ConfirmablePasswordController::class, 'store']);

    Route::put('password', [\App\Http\Controllers\Auth\PasswordController::class, 'update'])->name('password.update');

    // Notifications API
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.readAll');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');

    // Push Subscriptions API
    Route::get('/push/vapid-key', [\App\Http\Controllers\PushSubscriptionController::class, 'vapidPublicKey'])->name('push.vapid');
    Route::get('/push/subscriptions', [\App\Http\Controllers\PushSubscriptionController::class, 'index'])->name('push.index');
    Route::post('/push/subscribe', [\App\Http\Controllers\PushSubscriptionController::class, 'store'])->name('push.subscribe');
    Route::post('/push/unsubscribe', [\App\Http\Controllers\PushSubscriptionController::class, 'destroy'])->name('push.unsubscribe');
    Route::post('/push/test', [\App\Http\Controllers\PushSubscriptionController::class, 'test'])->name('push.test');

    // Lightweight counters API for sidebar badges
    Route::get('/counters', [CounterController::class, 'index'])->name('counters.index');

    // Dashboard Tutorials API
    Route::get('/tutorials/{dashboard}', [\App\Http\Controllers\DashboardTutorialController::class, 'index'])->name('tutorials.index');
    Route::post('/tutorials', [\App\Http\Controllers\DashboardTutorialController::class, 'store'])->name('tutorials.store');
    Route::get('/tutorials/{tutorial}', [\App\Http\Controllers\DashboardTutorialController::class, 'show'])->name('tutorials.show');
    Route::put('/tutorials/{tutorial}', [\App\Http\Controllers\DashboardTutorialController::class, 'update'])->name('tutorials.update');
    Route::post('/tutorials/{tutorial}', [\App\Http\Controllers\DashboardTutorialController::class, 'update'])->name('tutorials.update.post');
    Route::delete('/tutorials/{tutorial}', [\App\Http\Controllers\DashboardTutorialController::class, 'destroy'])->name('tutorials.destroy');

    // AI Assistant API (transfer and history require auth)
    Route::post('/ai/transfer', [\App\Http\Controllers\ChatController::class, 'requestTransfer'])->name('ai.transfer');
    Route::get('/ai/history', [\App\Http\Controllers\ChatController::class, 'history'])->name('ai.history');
    
    // Agent Chat Management (super_admin, control_room_operator, admin)
    Route::prefix('agent/chats')->name('agent.chats.')->group(function () {
        Route::get('/pending', [\App\Http\Controllers\ChatController::class, 'pendingTransfers'])->name('pending');
        Route::get('/active', [\App\Http\Controllers\ChatController::class, 'agentChats'])->name('active');
        Route::post('/accept', [\App\Http\Controllers\ChatController::class, 'acceptTransfer'])->name('accept');
        Route::post('/reject', [\App\Http\Controllers\ChatController::class, 'rejectTransfer'])->name('reject');
        Route::post('/respond', [\App\Http\Controllers\ChatController::class, 'agentRespond'])->name('respond');
        Route::post('/resolve', [\App\Http\Controllers\ChatController::class, 'resolveChat'])->name('resolve');
    });
});

// Public AI Assistant API (accessible to guests on landing page)
Route::post('/ai/chat', [\App\Http\Controllers\ChatController::class, 'chat'])->name('ai.chat');

// Help Center (public)
Route::get('/help', [\App\Http\Controllers\HelpController::class, 'index'])->name('help.index');
Route::get('/help/search', [\App\Http\Controllers\HelpController::class, 'search'])->name('help.search');
Route::get('/help/{slug}', [\App\Http\Controllers\HelpController::class, 'show'])->name('help.show');
Route::middleware(['auth', 'role:super_admin'])->prefix('superadmin')->name('superadmin.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\SuperAdmin\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/me', [\App\Http\Controllers\SuperAdmin\ProfileController::class, 'index'])->name('profile');
    Route::post('/modules/{module}/toggle', [\App\Http\Controllers\SuperAdmin\DashboardController::class, 'toggleModule'])->name('modules.toggle');
    Route::post('/cache/clear', [\App\Http\Controllers\SuperAdmin\DashboardController::class, 'clearCache'])->name('cache.clear');
    Route::post('/maintenance/enable', [\App\Http\Controllers\SuperAdmin\DashboardController::class, 'enableMaintenance'])->name('maintenance.enable');
    Route::post('/maintenance/disable', [\App\Http\Controllers\SuperAdmin\DashboardController::class, 'disableMaintenance'])->name('maintenance.disable');
	Route::post('/settings/attendance/methods', [\App\Http\Controllers\SuperAdmin\AttendanceSettingsController::class, 'update'])->name('attendance.methods.update');
    
    // QR Code Generation (SuperAdmin)
    Route::get('/qr-codes', [\App\Http\Controllers\SupervisorQRCodesController::class, 'index'])->name('qr-codes');
    Route::get('/qr-codes/download-bulk', [\App\Http\Controllers\SupervisorQRCodesController::class, 'downloadBulk'])->name('qr-codes.download-bulk');
    Route::get('/qr-codes/download-saved', [\App\Http\Controllers\SupervisorQRCodesController::class, 'downloadSaved'])->name('qr-codes.download-saved');
    Route::get('/qr-codes/list-saved', [\App\Http\Controllers\SupervisorQRCodesController::class, 'listSaved'])->name('qr-codes.list-saved');
    
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
        $users = \App\Models\User::with('roles', 'zone')
            ->when(request('search'), function($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(20)
            ->through(function ($user) {
                $user->avatar_url = $user->avatar_url;
                $user->initials = $user->initials;
                return $user;
            });
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
        $view = request('view', 'active');

        // Build base query
        $baseQuery = \App\Models\Guards\Guard::with('supervisor')
            ->where('employee_role', 'guard')
            ->when(request('search'), function($q, $search) {
                $q->where(function($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                       ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->profileStatus(request('profile_status'))
            ->when(request('zone_id'), function($q, $zoneId) {
                $q->where('zone_id', $zoneId);
            });

        // Separate active and inactive guards
        $activeStatuses = ['active', 'on_leave', 'training'];
        $inactiveStatuses = ['inactive', 'suspended', 'dismissed', 'absconded', 'resigned', 'retired'];

        // Fetch supervisors and zones early (needed by both views)
        $supervisors = \App\Models\User::where('status', 'active')
            ->whereHas('roles', function ($q) {
                $q->whereIn('name', ['supervisor', 'sergeant', 'zone_commander'])
                  ->where('guard_name', 'web');
            })
            ->orderBy('name')
            ->get(['id','name']);

        $zones = \App\Models\Zone::orderBy('name')->get(['id','name']);

        // Calculate stats for ALL guards (not just paginated)
        $statsQuery = \App\Models\Guards\Guard::query()
            ->where('employee_role', 'guard')
            ->when(request('search'), function($q, $search) {
                $q->where(function($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                       ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->profileStatus(request('profile_status'))
            ->when(request('zone_id'), function($q, $zoneId) {
                $q->where('zone_id', $zoneId);
            });

        $stats = [
            'total' => $statsQuery->count(),
            'active' => (clone $statsQuery)->whereIn('status', $activeStatuses)->count(),
            'inactive' => (clone $statsQuery)->whereIn('status', $inactiveStatuses)->count(),
            'assigned' => (clone $statsQuery)->whereIn('status', $activeStatuses)->whereHas('assignments', fn($q) => $q->where('status', 'active'))->count(),
            'incomplete' => (clone $statsQuery)->where(function ($q) {
                $q->whereNull('id_number')->orWhere('id_number', '')
                  ->orWhereNull('emergency_contact_name')->orWhere('emergency_contact_name', '')
                  ->orWhereNull('emergency_contact_phone')->orWhere('emergency_contact_phone', '');
            })->count(),
        ];

        if ($view === 'inactive') {
            // Fetch only inactive guards
            $guards = (clone $baseQuery)
                ->whereIn('status', $inactiveStatuses)
                ->orderBy($sort, $dir)
                ->paginate($perPage)
                ->withQueryString();

            $activeGuards = (clone $baseQuery)
                ->whereIn('status', $activeStatuses)
                ->when(request('status'), function($q, $status) {
                    $q->where('status', $status);
                })
                ->when(request('supervisor_id'), function($q, $supervisorId) {
                    if ($supervisorId === 'unassigned') {
                        $q->whereNull('supervisor_id');
                    } else {
                        $q->where('supervisor_id', $supervisorId);
                    }
                })
                ->orderBy($sort, $dir)
                ->paginate($perPage)
                ->withQueryString();

            return Inertia::render('SuperAdmin/Guards', [
                'guards' => $activeGuards,
                'inactiveGuards' => $guards,
                'filters' => request()->only(['search','status','profile_status','zone_id','supervisor_id','sort','dir','per_page','view']),
                'supervisors' => $supervisors,
                'zones' => $zones,
                'stats' => $stats,
                'can' => [
                    'suspend' => true,
                    'dismiss' => true,
                    'reinstate' => true,
                ],
            ]);
        }

        // Default: fetch active guards
        $guards = (clone $baseQuery)
            ->whereIn('status', $activeStatuses)
            ->when(request('status'), function($q, $status) {
                $q->where('status', $status);
            })
            ->when(request('supervisor_id'), function($q, $supervisorId) {
                if ($supervisorId === 'unassigned') {
                    $q->whereNull('supervisor_id');
                } else {
                    $q->where('supervisor_id', $supervisorId);
                }
            })
            ->orderBy($sort, $dir)
            ->paginate($perPage)
            ->withQueryString();

        // Fetch inactive guards (for stats and inactive view)
        $inactiveGuards = (clone $baseQuery)
            ->whereIn('status', $inactiveStatuses)
            ->orderBy($sort, $dir)
            ->paginate($perPage)
            ->withQueryString();

        $guards->getCollection()->transform(function ($g) {
            $g->is_profile_complete = (bool) $g->is_profile_complete;
            return $g;
        });

        return Inertia::render('SuperAdmin/Guards', [
            'guards' => $guards,
            'inactiveGuards' => $inactiveGuards,
            'filters' => request()->only(['search','status','profile_status','zone_id','supervisor_id','sort','dir','per_page','view']),
            'supervisors' => $supervisors,
            'zones' => $zones,
            'stats' => $stats,
            'can' => [
                'suspend' => true,
                'dismiss' => true,
                'reinstate' => true,
            ],
        ]);
    })->name('guards');

    // SuperAdmin Guard bulk import routes
    Route::get('/guards/bulk-import-template', [\App\Http\Controllers\Admin\GuardController::class, 'bulkImportTemplate'])->name('guards.bulk-import-template');
    Route::post('/guards/bulk-import', [\App\Http\Controllers\Admin\GuardController::class, 'bulkImport'])->name('guards.bulk-import');

    // SuperAdmin sites JSON endpoint for guard assignment
    Route::get('/sites/json', [\App\Http\Controllers\Admin\ClientController::class, 'sitesJson'])->name('sites.json');

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
                $q->whereIn('name', ['supervisor', 'sergeant', 'zone_commander'])
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

    // Security Center
    Route::get('/security/overview', [SystemController::class, 'securityOverview'])->name('security.overview');
    Route::post('/security/force-logout', [SystemController::class, 'securityForceLogout'])->name('security.force-logout');
    Route::post('/security/invalidate-remember-tokens', [SystemController::class, 'securityInvalidateRememberTokens'])->name('security.invalidate-remember-tokens');
    Route::post('/security/clear-password-reset-tokens', [SystemController::class, 'securityClearPasswordResetTokens'])->name('security.clear-password-reset-tokens');
    Route::post('/security/revoke-api-tokens', [SystemController::class, 'securityRevokeApiTokens'])->name('security.revoke-api-tokens');

    // AI Settings
    Route::get('/ai-settings', [\App\Http\Controllers\SuperAdmin\AiSettingsController::class, 'index'])->name('ai-settings');
    Route::put('/ai-settings/{provider}', [\App\Http\Controllers\SuperAdmin\AiSettingsController::class, 'update'])->name('ai-settings.update');
    Route::post('/ai-settings/{provider}/enable', [\App\Http\Controllers\SuperAdmin\AiSettingsController::class, 'enable'])->name('ai-settings.enable');
    Route::post('/ai-settings/{provider}/disable', [\App\Http\Controllers\SuperAdmin\AiSettingsController::class, 'disable'])->name('ai-settings.disable');
    Route::post('/ai-settings/{provider}/test', [\App\Http\Controllers\SuperAdmin\AiSettingsController::class, 'test'])->name('ai-settings.test');
    Route::get('/ai-settings/{provider}/models', [\App\Http\Controllers\SuperAdmin\AiSettingsController::class, 'models'])->name('ai-settings.models');
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
        if ($user->hasRole('operations_manager')) {
            return redirect()->route('operations.dashboard');
        }
        if ($user->hasRole('operations_officer')) {
            return redirect()->route('operations.dashboard');
        }
        if ($user->hasRole('control_room_operator')) {
            return redirect()->route('control-room.dashboard');
        }
        if ($user->hasRole('zone_commander')) {
            return redirect()->route('zone.dashboard');
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
        if ($user->hasRole('trainer')) {
            return redirect()->route('training.dashboard');
        }
        if ($user->hasRole('client')) {
            return redirect()->route('client.dashboard');
        }
        if ($user->hasRole('guard')) {
            return redirect()->route('guard.profile');
        }
        if ($user->hasAnyRole(['finance_officer','accountant','finance','accounting'])) {
            return redirect()->route('finance.dashboard');
        }
        if ($user->hasAnyRole(['executive_assistant','receptionist','personal_assistant'])) {
            return redirect()->route('front-office.dashboard');
        }
        abort(403, 'Unauthorized. No dashboard is configured for your role.');
    
    })->name('dashboard');

    // Infractions routes - accessible by admin, zone commander, and supervisor
    Route::resource('infractions', \App\Http\Controllers\Guards\InfractionController::class)->except(['edit', 'update', 'destroy']);
    Route::get('infractions/{infraction}/review', [\App\Http\Controllers\Guards\InfractionController::class, 'review'])->name('infractions.review');
    Route::put('infractions/{infraction}/status', [\App\Http\Controllers\Guards\InfractionController::class, 'updateStatus'])->name('infractions.update-status');

    // Zone Commander routes
    Route::middleware(['role:zone_commander'])->prefix('zone')->name('zone.')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\ZoneCommander\DashboardController::class, 'index'])
            ->middleware('permission:zone.view.dashboard')
            ->name('dashboard');

        Route::get('/me', [\App\Http\Controllers\ZoneCommander\ProfileController::class, 'index'])->name('profile');

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
        Route::get('/sites/json', [\App\Http\Controllers\ZoneCommander\SiteController::class, 'sitesJson'])
            ->middleware('permission:zone.view.sites')
            ->name('sites.json');

        // Guards & Supervisors
        Route::get('/guards', [\App\Http\Controllers\ZoneCommander\GuardController::class, 'index'])
            ->middleware('permission:zone.view.guards|guards.view')
            ->name('guards.index');
        Route::post('/guards/assign-site', [\App\Http\Controllers\ZoneCommander\GuardController::class, 'assignToSite'])
            ->middleware('permission:zone.view.guards|guards.view')
            ->name('guards.assign-site');
        Route::post('/guards/unassign-site', [\App\Http\Controllers\ZoneCommander\GuardController::class, 'unassignFromSite'])
            ->middleware('permission:zone.view.guards|guards.view')
            ->name('guards.unassign-site');
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
        Route::post('/attendance/mark-present', [\App\Http\Controllers\ZoneCommander\AttendanceController::class, 'markPresent'])
            ->middleware('permission:zone.attendance.manage')
            ->name('attendance.mark-present');

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

        // Checkpoints management
        Route::get('/checkpoints', [\App\Http\Controllers\ZoneCommander\CheckpointController::class, 'index'])
            ->middleware('permission:zone.view.sites')
            ->name('checkpoints.index');
        Route::get('/checkpoints/{checkpoint}/qr', [\App\Http\Controllers\ZoneCommander\CheckpointController::class, 'qr'])
            ->middleware('permission:zone.view.sites')
            ->name('checkpoints.qr');
        Route::get('/checkpoints/{checkpoint}/qr-print', [\App\Http\Controllers\ZoneCommander\CheckpointController::class, 'qrPrint'])
            ->middleware('permission:zone.view.sites')
            ->name('checkpoints.qr-print');
        Route::get('/checkpoints/bulk-print', [\App\Http\Controllers\ZoneCommander\CheckpointController::class, 'bulkPrint'])
            ->middleware('permission:zone.view.sites')
            ->name('checkpoints.bulk-print');
        Route::get('/checkpoints/download-bulk', [\App\Http\Controllers\ZoneCommander\CheckpointController::class, 'downloadBulk'])
            ->middleware('permission:zone.view.sites')
            ->name('checkpoints.download-bulk');
    });

    // Guard profile routes (for guard role users)
    Route::middleware(['role:guard'])->prefix('guard')->name('guard.')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Guards\DirectoryController::class, 'myDashboard'])->name('dashboard');
        Route::get('/me', [\App\Http\Controllers\Guards\ProfileController::class, 'index'])->name('profile');
    });

    Route::middleware(['role:supervisor,admin,super_admin'])->prefix('supervisor')->name('supervisor.')->group(function () {
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

    // Cross-module: legacy Expense Request aliases (now forwards to unified requisitions)
    Route::get('/request/expense', function() {
        return redirect()->route('requisitions.index');
    })->name('expense.request.create');
    Route::post('/request/expense', function(\Illuminate\Http\Request $request) {
        return app(\App\Http\Controllers\Requisitions\RequisitionController::class)->store($request);
    })->name('expense.request.store');

    // Profile routes (edit/update/avatar)
    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [\App\Http\Controllers\ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/avatar', [\App\Http\Controllers\ProfileController::class, 'updateAvatar'])->name('profile.avatar');

    // Profile dashboard (commissions, payroll summaries)
    Route::get('/me', [\App\Http\Controllers\Profile\ProfileDashboardController::class, 'index'])->name('profile.dashboard');
    Route::post('/me/commissions/{commission}/claim', [\App\Http\Controllers\Profile\ProfileDashboardController::class, 'claim'])->name('profile.commissions.claim');

    // Tasks - View and completion accessible to all authenticated users
    Route::middleware(['auth'])->group(function () {
        Route::get('/tasks', [\App\Http\Controllers\TaskController::class, 'dashboard'])->name('tasks.dashboard');
        Route::get('/tasks/my-tasks', [\App\Http\Controllers\TaskController::class, 'myTasks'])->name('tasks.my');
        Route::post('/tasks/{task}/complete', [\App\Http\Controllers\TaskController::class, 'complete'])->name('tasks.complete');
    });

    // Tasks - Management restricted to front-office roles only
    Route::middleware(['auth', 'role:executive_assistant|receptionist|personal_assistant|admin|super_admin'])->group(function () {
        Route::post('/tasks', [\App\Http\Controllers\TaskController::class, 'store'])->name('tasks.store');
        Route::put('/tasks/{task}', [\App\Http\Controllers\TaskController::class, 'update'])->name('tasks.update');
        Route::post('/tasks/bulk-update', [\App\Http\Controllers\TaskController::class, 'bulkUpdate'])->name('tasks.bulk.update');
        Route::post('/tasks/{task}/comment', [\App\Http\Controllers\TaskController::class, 'addComment'])->name('tasks.comment.add');
        Route::post('/tasks/{task}/time', [\App\Http\Controllers\TaskController::class, 'logTime'])->name('tasks.time.log');
        Route::get('/tasks/templates', [\App\Http\Controllers\TaskController::class, 'templates'])->name('tasks.templates');
        Route::post('/tasks/templates', [\App\Http\Controllers\TaskController::class, 'storeTemplate'])->name('tasks.templates.store');
        Route::delete('/tasks/{task}', [\App\Http\Controllers\TaskController::class, 'destroy'])->name('tasks.destroy');
    });

});

// Incentive Dashboard API Routes
Route::middleware(['auth'])->prefix('api/incentives')->name('api.incentives.')->group(function () {
    Route::get('/summary', [\App\Http\Controllers\IncentiveDashboardController::class, 'summary'])->name('summary');
    Route::post('/calculate', [\App\Http\Controllers\IncentiveDashboardController::class, 'quickCalculate'])->name('calculate');
});