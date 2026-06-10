<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;

// Configure rate limiters for invoice operations
RateLimiter::for('invoice-operations', function () {
    return \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by(request()->user()?->id ?: request()->ip());
});

RateLimiter::for('invoice-create', function () {
    return \Illuminate\Cache\RateLimiting\Limit::perMinute(10)->by(request()->user()?->id ?: request()->ip());
});

Route::prefix('finance')->name('finance.')->group(function () {
    // Payment gateway webhooks must be publicly accessible (gateway -> our server).
    // For real integrations, verify signatures using per-gateway secrets.
    Route::post('payments/webhook/{gateway}', [\App\Http\Controllers\Finance\PaymentGatewayWebhookController::class, 'handle'])
        ->name('payments.webhook');

    // Finance module routes
    Route::middleware(['auth', 'role:super_admin|finance_officer|accountant|finance|accounting|asset_manager|guard|client'])
        ->group(function () {
            Route::get('/', [\App\Http\Controllers\Finance\DashboardController::class, 'index'])
                ->name('dashboard');

            Route::get('me', [\App\Http\Controllers\Profile\ProfileDashboardController::class, 'index'])->name('profile');

            // Drilldown API endpoints (returns JSON)
            Route::get('drilldown/month/{year}/{month}', [\App\Http\Controllers\Finance\DashboardController::class, 'monthDrilldown'])
                ->name('drilldown.month');

            Route::get('drilldown/budget/{budget}', [\App\Http\Controllers\Finance\DashboardController::class, 'budgetDrilldown'])
                ->name('drilldown.budget');

            // Expense Management
            Route::resource('expenses', \App\Http\Controllers\Finance\ExpenseController::class);
            Route::post('expenses/{expense}/approve', [\App\Http\Controllers\Finance\ExpenseController::class, 'approve'])
                ->name('expenses.approve')
                ->middleware('can:approve,expense');
            Route::post('expenses/{expense}/reject', [\App\Http\Controllers\Finance\ExpenseController::class, 'reject'])
                ->name('expenses.reject')
                ->middleware('can:reject,expense');
            Route::post('expenses/{expense}/resubmit', [\App\Http\Controllers\Finance\ExpenseController::class, 'resubmit'])
                ->name('expenses.resubmit')
                ->middleware('can:resubmit,expense');

            // Invoice Management (custom endpoints must come BEFORE the resource route)
            Route::middleware(['throttle:invoice-operations'])->group(function () {
                Route::get('invoices/next-number', [\App\Http\Controllers\Finance\InvoiceController::class, 'nextNumber'])
                    ->name('invoices.next-number');
                Route::get('invoices/service-line-items', [\App\Http\Controllers\Finance\InvoiceController::class, 'serviceLineItems'])
                    ->name('invoices.service-line-items');
                Route::get('invoices/{invoice}/pdf', [\App\Http\Controllers\Finance\InvoiceController::class, 'pdf'])
                    ->name('invoices.pdf');
                Route::get('invoices/{invoice}/print', [\App\Http\Controllers\Finance\InvoiceController::class, 'print'])
                    ->name('invoices.print');
                Route::get('invoices/{invoice}/preview', [\App\Http\Controllers\Finance\InvoiceController::class, 'preview'])
                    ->name('invoices.preview');
                Route::post('invoices/{invoice}/send', [\App\Http\Controllers\Finance\InvoiceController::class, 'send'])
                    ->name('invoices.send');
                Route::post('invoices/{invoice}/mark-paid', [\App\Http\Controllers\Finance\InvoiceController::class, 'markPaid'])
                    ->name('invoices.mark-paid');
                Route::post('invoices/{invoice}/cancel', [\App\Http\Controllers\Finance\InvoiceController::class, 'cancel'])
                    ->name('invoices.cancel');
                Route::post('invoices/{invoice}/record-payment', [\App\Http\Controllers\Finance\InvoiceController::class, 'recordPayment'])
                    ->name('invoices.record-payment');
            });

            // Invoice CRUD operations with stricter rate limit
            Route::middleware(['throttle:invoice-create'])->group(function () {
                Route::resource('invoices', \App\Http\Controllers\Finance\InvoiceController::class);
            });

            // Budget Management
            Route::resource('budgets', \App\Http\Controllers\Finance\BudgetController::class);

            // Payroll
            Route::get('payroll', [\App\Http\Controllers\Finance\PayrollRunController::class, 'index'])->name('payroll.index');
            Route::get('payroll/create', [\App\Http\Controllers\Finance\PayrollRunController::class, 'create'])->name('payroll.create');
            Route::post('payroll', [\App\Http\Controllers\Finance\PayrollRunController::class, 'store'])->name('payroll.store');
            Route::get('payroll/{payroll}', [\App\Http\Controllers\Finance\PayrollRunController::class, 'show'])->name('payroll.show');
            Route::post('payroll/{payroll}/process', [\App\Http\Controllers\Finance\PayrollRunController::class, 'process'])->name('payroll.process');
            Route::put('payroll/entries/{entry}', [\App\Http\Controllers\Finance\PayrollRunController::class, 'updateEntry'])->name('payroll.entries.update');

            // Client Payments Checker (view in Finance, manage restricted)
            Route::get('payments', [\App\Http\Controllers\Admin\PaymentController::class, 'index'])
                ->name('payments.index')
                ->middleware('permission:finance.view');
            Route::post('payments/toggle', [\App\Http\Controllers\Admin\PaymentController::class, 'toggle'])
                ->name('payments.toggle')
                ->middleware('permission:finance.manage');

            // Petty Cash Management
            Route::prefix('petty-cash')->name('petty-cash.')->group(function () {
                Route::get('/', [\App\Http\Controllers\Finance\PettyCashController::class, 'index'])->name('index');
                Route::post('/', [\App\Http\Controllers\Finance\PettyCashController::class, 'store'])->name('store');
                Route::post('/{entry}/approve', [\App\Http\Controllers\Finance\PettyCashController::class, 'approve'])->name('approve');
                Route::post('/{entry}/reject', [\App\Http\Controllers\Finance\PettyCashController::class, 'reject'])->name('reject');
                Route::delete('/{entry}', [\App\Http\Controllers\Finance\PettyCashController::class, 'destroy'])->name('destroy');
            });

            // Approval Management (admins only)
            Route::middleware(['role:super_admin|admin'])->group(function () {
                Route::get('approvals', [\App\Http\Controllers\Finance\ApprovalController::class, 'index'])
                    ->name('approvals.index');
                Route::post('approvals', [\App\Http\Controllers\Finance\ApprovalController::class, 'store'])
                    ->name('approvals.store');
                Route::get('approvals/{approval}', [\App\Http\Controllers\Finance\ApprovalController::class, 'show'])
                    ->name('approvals.show');
                Route::post('approvals/{approval}/approve', [\App\Http\Controllers\Finance\ApprovalController::class, 'approve'])
                    ->name('approvals.approve');
                Route::post('approvals/{approval}/reject', [\App\Http\Controllers\Finance\ApprovalController::class, 'reject'])
                    ->name('approvals.reject');
            });
        });
});

