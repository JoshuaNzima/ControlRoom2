<?php

use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])
    ->prefix('front-office')
    ->name('front-office.')
    ->middleware(['role_or_permission:front_office|receptionist|client_service|manager|super_admin|front-office.dashboard.view'])
    ->group(function () {
        Route::get('/', [\App\Http\Controllers\FrontOffice\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/dashboard', [\App\Http\Controllers\FrontOffice\DashboardController::class, 'index']);
        Route::get('/me', [\App\Http\Controllers\Profile\ProfileDashboardController::class, 'index'])->name('profile');
    });
