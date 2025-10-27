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
        // Clients Management
        Route::prefix('clients')->name('clients.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\ClientController::class, 'index'])->name('index');
            Route::get('/create', [\App\Http\Controllers\Admin\ClientController::class, 'create'])->name('create');
            Route::post('/', [\App\Http\Controllers\Admin\ClientController::class, 'store'])->name('store');
            Route::get('/{client}', [\App\Http\Controllers\Admin\ClientController::class, 'show'])->name('show');
            Route::get('/{client}/edit', [\App\Http\Controllers\Admin\ClientController::class, 'edit'])->name('edit');
            Route::put('/{client}', [\App\Http\Controllers\Admin\ClientController::class, 'update'])->name('update');
            Route::delete('/{client}', [\App\Http\Controllers\Admin\ClientController::class, 'destroy'])->name('destroy');
            Route::post('/{client}/services', [\App\Http\Controllers\Admin\ClientController::class, 'updateServices'])->name('services.update');
            
            // Bulk Import
            Route::get('/bulk-import-template', [\App\Http\Controllers\Admin\ClientController::class, 'bulkImportTemplate'])->name('bulk-import-template');
            Route::post('/bulk-import', [\App\Http\Controllers\Admin\ClientController::class, 'bulkImport'])->name('bulk-import');
            
            // Sites Management
            Route::get('/{client}/sites/create', [\App\Http\Controllers\Admin\ClientController::class, 'createSite'])->name('sites.create');
            Route::post('/{client}/sites', [\App\Http\Controllers\Admin\ClientController::class, 'storeSite'])->name('sites.store');
        });

        // Services Management
        Route::prefix('services')->name('services.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\ServicesController::class, 'index'])->name('index');
            Route::post('/', [\App\Http\Controllers\Admin\ServicesController::class, 'store'])->name('store');
            Route::put('/{service}', [\App\Http\Controllers\Admin\ServicesController::class, 'update'])->name('update');
            Route::delete('/{service}', [\App\Http\Controllers\Admin\ServicesController::class, 'destroy'])->name('destroy');
        });
        // Client Sites nested routes
        // Client site routes moved into clients group above
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

