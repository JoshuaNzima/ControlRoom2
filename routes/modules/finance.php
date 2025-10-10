<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Finance module routes
Route::middleware(['auth', 'role:admin,super_admin'])
    ->prefix('finance')
    ->name('finance.')
    ->group(function () {
        Route::get('/', fn () => Inertia::render('Finance/Dashboard'))
            ->name('dashboard');

        // Add more finance routes here as needed, e.g., invoices, payments, budgets
        // Route::resource('invoices', \App\Http\Controllers\Finance\InvoiceController::class);
    });


