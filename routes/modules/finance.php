<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Finance module routes
Route::middleware(['auth', 'role:admin|super_admin|finance_officer|accountant|finance|accounting'])
    ->prefix('finance')
    ->name('finance.')
    ->group(function () {
        Route::get('/', [\App\Http\Controllers\Finance\DashboardController::class, 'index'])
            ->name('dashboard');

        // Drilldown API endpoints (returns JSON)
        Route::get('drilldown/month/{year}/{month}', [\App\Http\Controllers\Finance\DashboardController::class, 'monthDrilldown'])
            ->name('drilldown.month');

        Route::get('drilldown/budget/{budget}', [\App\Http\Controllers\Finance\DashboardController::class, 'budgetDrilldown'])
            ->name('drilldown.budget');

        // Expense Management
        Route::resource('expenses', \App\Http\Controllers\Finance\ExpenseController::class);
        Route::post('expenses/{expense}/approve', [\App\Http\Controllers\Finance\ExpenseController::class, 'approve'])
            ->name('expenses.approve')
            ->middleware('can:manage,expense');
        Route::post('expenses/{expense}/reject', [\App\Http\Controllers\Finance\ExpenseController::class, 'reject'])
            ->name('expenses.reject')
            ->middleware('can:manage,expense');

        // Invoice Management (custom endpoints must come BEFORE the resource route)
        Route::get('invoices/next-number', [\App\Http\Controllers\Finance\InvoiceController::class, 'nextNumber'])
            ->name('invoices.next-number');
        Route::get('invoices/service-line-items', [\App\Http\Controllers\Finance\InvoiceController::class, 'serviceLineItems'])
            ->name('invoices.service-line-items');
        Route::resource('invoices', \App\Http\Controllers\Finance\InvoiceController::class);
        Route::post('invoices/{invoice}/send', [\App\Http\Controllers\Finance\InvoiceController::class, 'send'])
            ->name('invoices.send');
        Route::post('invoices/{invoice}/mark-paid', [\App\Http\Controllers\Finance\InvoiceController::class, 'markPaid'])
            ->name('invoices.mark-paid');
        Route::post('invoices/{invoice}/cancel', [\App\Http\Controllers\Finance\InvoiceController::class, 'cancel'])
            ->name('invoices.cancel');

        // Budget Management
        Route::resource('budgets', \App\Http\Controllers\Finance\BudgetController::class);

        // Approval Management
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


