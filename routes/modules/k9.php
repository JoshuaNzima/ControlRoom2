<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::middleware(['permission:k9.view'])->prefix('k9')->name('k9.')->group(function () {
        // Redirect legacy K9 routes to the unified Business Dev K9 routes
        Route::get('/dashboard', fn() => redirect()->route('admin.business-dev.k9.dashboard'))->name('dashboard');
        Route::get('/dogs', fn() => redirect()->route('admin.business-dev.k9.dogs'))->name('dogs');
        Route::get('/handlers', fn() => redirect()->route('admin.business-dev.k9.handlers'))->name('handlers');
    });
});
