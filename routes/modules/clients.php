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

    // Shift Schedules
    Route::get('/schedules', [PortalController::class, 'schedules'])->name('schedules');

    // Profile
    Route::get('/profile', [PortalController::class, 'profile'])->name('profile');
    Route::put('/profile', [PortalController::class, 'updateProfile'])->name('profile.update');
    Route::put('/profile/password', [PortalController::class, 'updatePassword'])->name('profile.password');

    // Settings
    Route::get('/settings', [PortalController::class, 'settings'])->name('settings');
    Route::put('/settings', [PortalController::class, 'updateSettings'])->name('settings.update');

    // Support Tickets
    Route::get('/support', [PortalController::class, 'support'])->name('support');
    Route::post('/support', [PortalController::class, 'storeTicket'])->name('support.store');
    Route::get('/support/{ticket}', [PortalController::class, 'showTicket'])->name('support.show');
    Route::post('/support/{ticket}/reply', [PortalController::class, 'replyTicket'])->name('support.reply');
});
