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

        Route::get('/marketing/me', [\App\Http\Controllers\Profile\ProfileDashboardController::class, 'index'])->name('marketing.profile');

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
        Route::get('/me', [\App\Http\Controllers\Profile\ProfileDashboardController::class, 'index'])->name('profile');
        Route::get('/settings', [\App\Http\Controllers\Admin\SettingController::class, 'index'])->name('settings.index');
        Route::prefix('qr-codes')->name('qr-codes.')->group(function () {
            Route::get('/', [\App\Http\Controllers\SupervisorQRCodesController::class, 'index'])->name('index');
            Route::get('/download-bulk', [\App\Http\Controllers\SupervisorQRCodesController::class, 'downloadBulk'])->name('download-bulk');
            Route::get('/download-saved', [\App\Http\Controllers\SupervisorQRCodesController::class, 'downloadSaved'])->name('download-saved');
            Route::get('/list-saved', [\App\Http\Controllers\SupervisorQRCodesController::class, 'listSaved'])->name('list-saved');
        });
        // Finance Settings endpoints
        Route::post('/settings/finance/payroll-defaults', [\App\Http\Controllers\Admin\FinanceSettingController::class, 'updatePayrollDefaults'])
            ->name('settings.finance.payroll-defaults');
        Route::post('/settings/finance/pay-profiles', [\App\Http\Controllers\Admin\FinanceSettingController::class, 'storePayProfile'])
            ->name('settings.finance.pay-profiles.store');
        Route::put('/settings/finance/pay-profiles/{payProfile}', [\App\Http\Controllers\Admin\FinanceSettingController::class, 'updatePayProfile'])
            ->name('settings.finance.pay-profiles.update');
        Route::delete('/settings/finance/pay-profiles/{payProfile}', [\App\Http\Controllers\Admin\FinanceSettingController::class, 'destroyPayProfile'])
            ->name('settings.finance.pay-profiles.destroy');
        // HR Settings endpoints (Guard Grades)
        Route::post('/settings/hr/guard-grades', [\App\Http\Controllers\Admin\GuardGradeController::class, 'store'])
            ->name('settings.hr.guard-grades.store');
        Route::put('/settings/hr/guard-grades/{guardGrade}', [\App\Http\Controllers\Admin\GuardGradeController::class, 'update'])
            ->name('settings.hr.guard-grades.update');
        Route::delete('/settings/hr/guard-grades/{guardGrade}', [\App\Http\Controllers\Admin\GuardGradeController::class, 'destroy'])
            ->name('settings.hr.guard-grades.destroy');
        Route::get('/reports', [\App\Http\Controllers\Admin\ReportController::class, 'index'])->name('reports.index');
        Route::get('/modules', [\App\Http\Controllers\Admin\ModuleController::class, 'index'])->name('modules.index');
        Route::get('/modules/{module}', [\App\Http\Controllers\Admin\ModuleSummaryController::class, 'show'])->name('modules.summary');
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
            // JSON API for listing all client sites (active), supports optional search and zone filter
            Route::get('/sites/json', [\App\Http\Controllers\Admin\ClientController::class, 'sitesJson'])->name('sites.json');

            // QR Code helpers for Admin module (must not depend on control-room role middleware)
            Route::get('/sites/{site}/qr-code', [\App\Http\Controllers\ControlRoom\ClientsController::class, 'siteQr'])
                ->whereNumber('site')
                ->name('sites.qr');
            Route::get('/sites/{site}/qr-print', [\App\Http\Controllers\ControlRoom\ClientsController::class, 'siteQrPrint'])
                ->whereNumber('site')
                ->name('sites.qr-print');
            Route::get('/{client}/edit', [\App\Http\Controllers\Admin\ClientController::class, 'edit'])->name('edit');
            Route::put('/{client}', [\App\Http\Controllers\Admin\ClientController::class, 'update'])->name('update');
            Route::delete('/{client}', [\App\Http\Controllers\Admin\ClientController::class, 'destroy'])->name('destroy');
            Route::post('/{client}/services', [\App\Http\Controllers\Admin\ClientController::class, 'updateServices'])->name('services.update');
            
            // Sites Management
            Route::get('/{client}/sites/create', [\App\Http\Controllers\Admin\ClientController::class, 'createSite'])->name('sites.create');
            Route::post('/{client}/sites', [\App\Http\Controllers\Admin\ClientController::class, 'storeSite'])->name('sites.store');
            Route::get('/{client}/sites/{site}/json', [\App\Http\Controllers\Admin\ClientController::class, 'siteJson'])->whereNumber('site')->name('sites.show-json');
            Route::put('/{client}/sites/{site}', [\App\Http\Controllers\Admin\ClientController::class, 'updateSite'])->whereNumber('site')->name('sites.update');
            Route::delete('/{client}/sites/{site}', [\App\Http\Controllers\Admin\ClientController::class, 'destroySite'])->whereNumber('site')->name('sites.destroy');
            Route::get('/{client}/sites/deleted/json', [\App\Http\Controllers\Admin\ClientController::class, 'deletedSitesJson'])->name('sites.deleted-json');
            Route::post('/{client}/sites/{site}/restore', [\App\Http\Controllers\Admin\ClientController::class, 'restoreSite'])->whereNumber('site')->name('sites.restore');
            Route::post('/sites/bulk-update', [\App\Http\Controllers\Admin\ClientController::class, 'bulkUpdateSites'])->name('sites.bulk-update');
            
            // Client status toggle (activate/deactivate)
            Route::post('/{client}/toggle-status', [\App\Http\Controllers\Admin\ClientController::class, 'toggleStatus'])->name('toggle-status');

            // Supervisor/Sergeant assignment
            Route::middleware(['role:super_admin'])->group(function () {
                Route::post('/{client}/assign-supervisor', [\App\Http\Controllers\Admin\ClientController::class, 'assignSupervisor'])->name('assign-supervisor');
                Route::post('/{client}/unassign-supervisor', [\App\Http\Controllers\Admin\ClientController::class, 'unassignSupervisor'])->name('unassign-supervisor');
                Route::post('/{client}/assign-sergeant', [\App\Http\Controllers\Admin\ClientController::class, 'assignSergeant'])->name('assign-sergeant');
                Route::post('/{client}/unassign-sergeant', [\App\Http\Controllers\Admin\ClientController::class, 'unassignSergeant'])->name('unassign-sergeant');
            });
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
        // JSON API for fetching a single guard (used by modal pre-fill)
        Route::get('/guards/{guard}/json', [\App\Http\Controllers\Admin\GuardController::class, 'apiShow'])->name('guards.json');
        // CSV Export for guards (shared with Control Room export implementation)
        Route::get('/guards/export', [\App\Http\Controllers\ControlRoom\GuardsController::class, 'export'])->name('guards.export');
        Route::resource('guards', \App\Http\Controllers\Admin\GuardController::class)->except(['create','edit','show']);
        // Quick status actions for guards
        Route::post('/guards/{guard}/suspend', [\App\Http\Controllers\Admin\GuardController::class, 'suspend'])->name('guards.suspend');
        Route::post('/guards/{guard}/reinstate', [\App\Http\Controllers\Admin\GuardController::class, 'reinstate'])->name('guards.reinstate');
        Route::post('/guards/{guard}/dismiss', [\App\Http\Controllers\Admin\GuardController::class, 'dismiss'])->name('guards.dismiss');
        Route::post('/guards/{guard}/abscond', [\App\Http\Controllers\Admin\GuardController::class, 'abscond'])->name('guards.abscond');
        // Guard assignment to client site
        Route::post('/guards/assign-site', [\App\Http\Controllers\Admin\GuardAssignmentController::class, 'assignToSite'])->name('guards.assign-site');
        Route::post('/guards/unassign-site', [\App\Http\Controllers\Admin\GuardAssignmentController::class, 'unassignFromSite'])->name('guards.unassign-site');
        // Guard promotion (admin access)
        Route::post('/guards/{guard}/promote', [\App\Http\Controllers\HR\EmployeeController::class, 'promote'])->name('guards.promote');
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

        // Front Desk module (admin-scoped)
        Route::get('/front-desk', [\App\Http\Controllers\Admin\FrontDeskController::class, 'index'])->name('front-desk');
        Route::prefix('front-desk')->name('front-desk.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\FrontDeskController::class, 'index'])->name('index');
            Route::get('/me', [\App\Http\Controllers\Profile\ProfileDashboardController::class, 'index'])->name('profile');

            // Visitors
            Route::get('/visitors', [\App\Http\Controllers\Admin\VisitorController::class, 'index'])->name('visitors.index');
            Route::post('/visitors', [\App\Http\Controllers\Admin\VisitorController::class, 'store'])->name('visitors.store');
            Route::put('/visitors/{visitor}', [\App\Http\Controllers\Admin\VisitorController::class, 'update'])->name('visitors.update');
            Route::delete('/visitors/{visitor}', [\App\Http\Controllers\Admin\VisitorController::class, 'destroy'])->name('visitors.destroy');
            Route::get('/visitors/{visitor}/json', [\App\Http\Controllers\Admin\VisitorController::class, 'showJson'])->name('visitors.json');

            // Tickets
            Route::get('/tickets', [\App\Http\Controllers\Admin\TicketController::class, 'index'])->name('tickets.index');
            Route::post('/tickets', [\App\Http\Controllers\Admin\TicketController::class, 'store'])->name('tickets.store');
            Route::put('/tickets/{ticket}', [\App\Http\Controllers\Admin\TicketController::class, 'update'])->name('tickets.update');
            Route::delete('/tickets/{ticket}', [\App\Http\Controllers\Admin\TicketController::class, 'destroy'])->name('tickets.destroy');
            Route::get('/tickets/{ticket}/json', [\App\Http\Controllers\Admin\TicketController::class, 'showJson'])->name('tickets.json');

            // Settings
            Route::get('/settings', [\App\Http\Controllers\Admin\FrontDeskSettingController::class, 'index'])->name('settings');
            Route::post('/settings', [\App\Http\Controllers\Admin\FrontDeskSettingController::class, 'update'])->name('settings.update');
        });

        // Downs (admin can view same control-room UI for now)
        Route::get('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'index'])->name('downs.index');
        Route::post('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'store'])->name('downs.store');
        Route::post('/downs/{down}/escalate', [\App\Http\Controllers\ControlRoom\DownController::class, 'escalate'])->name('downs.escalate');
        Route::post('/downs/{down}/resolve', [\App\Http\Controllers\ControlRoom\DownController::class, 'resolve'])->name('downs.resolve');
        Route::post('/downs/{down}/abscond', [\App\Http\Controllers\ControlRoom\DownController::class, 'abscond'])->name('downs.abscond');

        // Guards search helper (used by Admin Downs to link a guard)
        Route::get('/guards/search', [\App\Http\Controllers\ControlRoom\GuardsController::class, 'search'])->name('guards.search');

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

        Route::get('/business-dev/me', [\App\Http\Controllers\Profile\ProfileDashboardController::class, 'index'])->name('business-dev.profile');

        Route::prefix('business-dev')->name('business-dev.')->group(function () {
            // Expose sites data to Business Dev module (read-only JSON for lookups/search)
            Route::get('/sites/json', [\App\Http\Controllers\Admin\ClientController::class, 'sitesJson'])
                ->name('sites.json');

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

            // Business Dev Operations page
            Route::get('/ops', function () {
                $today = now();
                $monthStart = $today->copy()->startOfMonth();
                $monthEnd = $today->copy()->endOfMonth();

                $summary = [
                    'upcoming_events' => (int) \App\Models\ClientEvent::whereDate('event_date', '>=', $today->toDateString())
                        ->whereIn('status', ['planned', 'confirmed'])
                        ->count(),
                    'month_event_revenue' => (float) \App\Models\ClientEvent::whereBetween('event_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                        ->whereIn('status', ['planned', 'confirmed', 'completed'])
                        ->sum('expected_amount'),
                    'k9_events_month' => (int) \App\Models\ClientEvent::whereBetween('event_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                        ->where('category', 'k9')
                        ->count(),
                    'k9_units_month' => (int) \App\Models\ClientEvent::whereBetween('event_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                        ->sum('k9_units'),
                    'active_clients_with_events' => (int) \App\Models\ClientEvent::distinct('client_id')->count('client_id'),
                    'active_sites' => (int) \App\Models\Guards\ClientSite::where('status', 'active')->count(),
                    'total_clients' => (int) \App\Models\Client::count(),
                    'contracts_active' => (int) \App\Models\Contract::where('status', 'active')->count(),
                    'contracts_draft' => (int) \App\Models\Contract::where('status', 'draft')->count(),
                    'contracts_expired' => (int) \App\Models\Contract::where('status', 'expired')->count(),
                ];

                return Inertia::render('Admin/BusinessDevOps', [
                    'summary' => $summary,
                ]);
            })->name('ops');

            // K9 module pages under Business Dev (unified module for same officers)
            Route::prefix('k9')->name('k9.')->group(function () {
                Route::get('/dashboard', fn() => Inertia::render('K9/Dashboard'))->name('dashboard');
                Route::get('/dogs', fn() => Inertia::render('K9/Dogs'))->name('dogs');
                Route::get('/handlers', fn() => Inertia::render('K9/Handlers'))->name('handlers');
            });

            // Commissions - for client acquisition
            Route::prefix('commissions')->name('commissions.')->group(function () {
                Route::get('/', [\App\Http\Controllers\Admin\CommissionController::class, 'index'])->name('index');
                Route::get('/create', [\App\Http\Controllers\Admin\CommissionController::class, 'create'])->name('create');
                Route::post('/', [\App\Http\Controllers\Admin\CommissionController::class, 'store'])->name('store');
                Route::get('/{commission}', [\App\Http\Controllers\Admin\CommissionController::class, 'show'])->name('show');
                Route::get('/{commission}/edit', [\App\Http\Controllers\Admin\CommissionController::class, 'edit'])->name('edit');
                Route::put('/{commission}', [\App\Http\Controllers\Admin\CommissionController::class, 'update'])->name('update');
                Route::delete('/{commission}', [\App\Http\Controllers\Admin\CommissionController::class, 'destroy'])->name('destroy');
                Route::post('/{commission}/approve', [\App\Http\Controllers\Admin\CommissionController::class, 'approve'])->name('approve');
                Route::post('/{commission}/pay', [\App\Http\Controllers\Admin\CommissionController::class, 'markAsPaid'])->name('pay');
                Route::post('/{commission}/reject', [\App\Http\Controllers\Admin\CommissionController::class, 'reject'])->name('reject');
            });

            // Incentives - monthly performance-based for supervisors/sergeants
            Route::prefix('incentives')->name('incentives.')->group(function () {
                Route::get('/', [\App\Http\Controllers\Admin\IncentiveController::class, 'index'])->name('index');
                Route::get('/profiles', [\App\Http\Controllers\Admin\IncentiveController::class, 'profiles'])->name('profiles');
                Route::put('/profiles/{profile}', [\App\Http\Controllers\Admin\IncentiveController::class, 'updateProfile'])->name('profiles.update');
                Route::post('/calculate', [\App\Http\Controllers\Admin\IncentiveController::class, 'calculate'])->name('calculate');
                Route::post('/records/{record}/approve', [\App\Http\Controllers\Admin\IncentiveController::class, 'approve'])->name('approve');
                Route::post('/records/{record}/pay', [\App\Http\Controllers\Admin\IncentiveController::class, 'markAsPaid'])->name('pay');
            });
        });
    });
