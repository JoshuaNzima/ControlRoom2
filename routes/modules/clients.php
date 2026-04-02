<?php

use App\Http\Controllers\Client\DashboardController;
use App\Http\Controllers\Client\PortalController;
use Illuminate\Support\Facades\Route;

// Client Portal Routes
Route::middleware(['auth', 'role:client'])->prefix('client')->name('client.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Client Portal Pages
    Route::get('/sites', [PortalController::class, 'sites'])->name('sites');
    Route::get('/reports', [PortalController::class, 'reports'])->name('reports');
    Route::get('/invoices', [PortalController::class, 'invoices'])->name('invoices');
});
