<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'role:client'])
    ->prefix('client')
    ->name('client.')
    ->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Client\DashboardController::class, 'index'])->name('dashboard');
    });

Route::middleware(['auth', 'role:admin,super_admin,marketing,marketing_officer,marketing_manager'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/marketing', [\App\Http\Controllers\Admin\MarketingController::class, 'index'])->name('marketing');

        Route::prefix('marketing')->name('marketing.')->group(function () {
            Route::get('/campaigns/{campaign}/json', [\App\Http\Controllers\Admin\MarketingCampaignController::class, 'showJson'])->name('campaigns.json');
            Route::resource('campaigns', \App\Http\Controllers\Admin\MarketingCampaignController::class)->except(['show', 'create', 'edit']);
            Route::get('/leads', [\App\Http\Controllers\Admin\LeadController::class, 'index'])->name('leads.index');
            Route::get('/leads/{lead}/json', [\App\Http\Controllers\Admin\LeadController::class, 'showJson'])->name('leads.json');
            Route::resource('leads', \App\Http\Controllers\Admin\LeadController::class)->except(['show', 'create', 'edit', 'index']);
            Route::get('/analytics', [\App\Http\Controllers\Admin\MarketingAnalyticsController::class, 'index'])->name('analytics');
            Route::get('/settings', [\App\Http\Controllers\Admin\MarketingSettingController::class, 'index'])->name('settings');
            Route::post('/settings', [\App\Http\Controllers\Admin\MarketingSettingController::class, 'update'])->name('settings.update');
        });
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
        Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/settings', [\App\Http\Controllers\Admin\SettingController::class, 'index'])->name('settings.index');
        // Finance Settings endpoints
        Route::post('/settings/finance/payroll-defaults', [\App\Http\Controllers\Admin\FinanceSettingController::class, 'updatePayrollDefaults'])
            ->name('settings.finance.payroll-defaults');
        Route::post('/settings/finance/pay-profiles', [\App\Http\Controllers\Admin\FinanceSettingController::class, 'storePayProfile'])
            ->name('settings.finance.pay-profiles.store');
        Route::put('/settings/finance/pay-profiles/{payProfile}', [\App\Http\Controllers\Admin\FinanceSettingController::class, 'updatePayProfile'])
            ->name('settings.finance.pay-profiles.update');
        Route::delete('/settings/finance/pay-profiles/{payProfile}', [\App\Http\Controllers\Admin\FinanceSettingController::class, 'destroyPayProfile'])
            ->name('settings.finance.pay-profiles.destroy');
        Route::get('/reports', [\App\Http\Controllers\Admin\ReportController::class, 'index'])->name('reports.index');
        Route::get('/modules', [\App\Http\Controllers\Admin\ModuleController::class, 'index'])->name('modules.index');
        Route::resource('users', \App\Http\Controllers\Admin\UserController::class);
        Route::get('/clients/dashboard', [\App\Http\Controllers\Admin\ClientController::class, 'dashboard'])->name('clients.dashboard');
        // Clients Management
        Route::prefix('clients')->name('clients.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\ClientController::class, 'index'])->name('index');
            Route::post('/', [\App\Http\Controllers\Admin\ClientController::class, 'store'])->name('store');
            
            // Bulk Import (must come before /{client} route)
            Route::get('/bulk-import-template', [\App\Http\Controllers\Admin\ClientController::class, 'bulkImportTemplate'])->name('bulk-import-template');
            Route::post('/bulk-import', [\App\Http\Controllers\Admin\ClientController::class, 'bulkImport'])->name('bulk-import');
            
            // Client-specific routes (parameter routes must come after specific routes)
            // Standalone show page removed; use modal instead. Keep JSON and edit routes.
            // JSON API for fetching a single client (used by modal pre-fill)
            Route::get('/{client}/json', [\App\Http\Controllers\Admin\ClientController::class, 'apiShow'])->name('json');
            Route::get('/{client}/edit', [\App\Http\Controllers\Admin\ClientController::class, 'edit'])->name('edit');
            Route::put('/{client}', [\App\Http\Controllers\Admin\ClientController::class, 'update'])->name('update');
            Route::delete('/{client}', [\App\Http\Controllers\Admin\ClientController::class, 'destroy'])->name('destroy');
            Route::post('/{client}/services', [\App\Http\Controllers\Admin\ClientController::class, 'updateServices'])->name('services.update');
            
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
        Route::get('/qr-codes', [\App\Http\Controllers\SupervisorQRCodesController::class, 'index'])->name('qr-codes');
        Route::get('/qr-codes/download-bulk', [\App\Http\Controllers\SupervisorQRCodesController::class, 'downloadBulk'])->name('qr-codes.download-bulk');
        // Admin Finance landing (module-level admin page)
        Route::get('/finance', [\App\Http\Controllers\Admin\FinanceController::class, 'index'])->name('finance');

        

        

        // Payments checker
        Route::get('/payments', [\App\Http\Controllers\Admin\PaymentController::class, 'index'])->name('payments.index');
        Route::post('/payments/toggle', [\App\Http\Controllers\Admin\PaymentController::class, 'toggle'])->name('payments.toggle');

        // Approvals (admin managing finance approvals)
        Route::prefix('approvals')->name('approvals.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Finance\ApprovalController::class, 'index'])->name('index');
            Route::get('/{approval}', [\App\Http\Controllers\Finance\ApprovalController::class, 'show'])->name('show');
            Route::post('/{approval}/approve', [\App\Http\Controllers\Finance\ApprovalController::class, 'approve'])->name('approve');
            Route::post('/{approval}/reject', [\App\Http\Controllers\Finance\ApprovalController::class, 'reject'])->name('reject');
        });

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

Route::middleware(['auth', 'role:admin,super_admin,business_dev,business_development,bdo'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/business-dev', [\App\Http\Controllers\Admin\BusinessDevController::class, 'index'])->name('business-dev');

        Route::prefix('business-dev')->name('business-dev.')->group(function () {
            Route::get('/events/{event}/json', [\App\Http\Controllers\Admin\BusinessDevEventController::class, 'showJson'])
                ->name('events.json');

            Route::resource('events', \App\Http\Controllers\Admin\BusinessDevEventController::class)
                ->except(['show', 'create', 'edit']);

            Route::post('/events/{event}/invoice', [\App\Http\Controllers\Admin\BusinessDevEventController::class, 'createInvoice'])
                ->name('events.invoice');

            // Contracts management
            Route::get('/contracts/{contract}/json', [\App\Http\Controllers\Admin\ContractController::class, 'showJson'])
                ->name('contracts.json');
            Route::resource('contracts', \App\Http\Controllers\Admin\ContractController::class)
                ->except(['show', 'create', 'edit']);

            Route::get('/settings', [\App\Http\Controllers\Admin\BusinessDevSettingController::class, 'index'])->name('settings');
            Route::post('/settings', [\App\Http\Controllers\Admin\BusinessDevSettingController::class, 'update'])->name('settings.update');
        });
    });

