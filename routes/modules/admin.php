<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'role:client'])
    ->prefix('client')
    ->name('client.')
    ->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Client\DashboardController::class, 'index'])->name('dashboard');
    });

Route::middleware(['auth', 'role:manager,admin,super_admin'])
    ->prefix('manager')
    ->name('manager.')
    ->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Manager\DashboardController::class, 'index'])->name('dashboard');
    });

// Admin module-scoped routes
Route::middleware(['auth', 'role:admin,super_admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/settings', [\App\Http\Controllers\Admin\SettingController::class, 'index'])->name('settings.index');
        Route::get('/reports', [\App\Http\Controllers\Admin\ReportController::class, 'index'])->name('reports.index');
        Route::resource('users', \App\Http\Controllers\Admin\UserController::class);
        Route::get('/clients/dashboard', [\App\Http\Controllers\Admin\ClientController::class, 'dashboard'])->name('clients.dashboard');
        Route::resource('clients', \App\Http\Controllers\Admin\ClientController::class);
        // Client Sites nested routes
        Route::get('/clients/{client}/sites/create', [\App\Http\Controllers\Admin\ClientController::class, 'createSite'])->name('clients.sites.create');
        Route::post('/clients/{client}/sites', [\App\Http\Controllers\Admin\ClientController::class, 'storeSite'])->name('clients.sites.store');
        Route::get('/guards/dashboard', [\App\Http\Controllers\Admin\GuardController::class, 'dashboard'])->name('guards.dashboard');
        Route::resource('guards', \App\Http\Controllers\Admin\GuardController::class);
        // Admin Finance landing (module-level admin page)
        Route::get('/finance', fn () => Inertia::render('Admin/Finance'))->name('finance');

        // Marketing landing (placeholder)
        Route::get('/marketing', fn () => Inertia::render('ComingSoon', [
            'title' => 'Marketing',
            'description' => 'Marketing module is coming soon.'
        ]))->name('marketing');

        // Payments checker
        Route::get('/payments', [\App\Http\Controllers\Admin\PaymentController::class, 'index'])->name('payments.index');
        Route::post('/payments/toggle', [\App\Http\Controllers\Admin\PaymentController::class, 'toggle'])->name('payments.toggle');

        // Downs (admin can view same control-room UI for now)
        Route::get('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'index'])->name('downs.index');
        Route::post('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'store'])->name('downs.store');
        Route::post('/downs/{down}/escalate', [\App\Http\Controllers\ControlRoom\DownController::class, 'escalate'])->name('downs.escalate');
        Route::post('/downs/{down}/resolve', [\App\Http\Controllers\ControlRoom\DownController::class, 'resolve'])->name('downs.resolve');

        // Admin Control Room dashboard
        Route::get('/control-room', [\App\Http\Controllers\Admin\ControlRoomController::class, 'dashboard'])->name('control-room.dashboard');

        // Zone Commander mini dashboard (admin window)
        Route::get('/zone-commander/window', [\App\Http\Controllers\Admin\ZoneCommanderWindowController::class, 'index'])->name('zone-commander.window');
    });

