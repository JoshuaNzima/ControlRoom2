<?php

use Illuminate\Support\Facades\Route;

/**
 * Operations Module Routes
 * For operations_officer, manager, and related roles
 * Provides view access to incentives and other operational data
 */

Route::middleware(['auth', 'role_or_permission:operations_officer|manager|admin|super_admin|zone_commander'])->prefix('operations')->name('operations.')->group(function () {

    // Operations Dashboard
    Route::get('/dashboard', function () {
        return redirect()->route('admin.dashboard', ['tab' => 'operations']);
    })->name('dashboard');

    // Incentives - View only access for operations team
    Route::prefix('incentives')->name('incentives.')->group(function () {
        Route::get('/', function () {
            return redirect()->route('control-room.incentives.index');
        })->name('index');

        Route::get('/entries', function () {
            return redirect()->route('control-room.incentives.entries');
        })->name('entries');

        Route::get('/supervisor', function () {
            return redirect()->route('control-room.incentives.supervisor');
        })->name('supervisor');
    });

    // Operational Reports
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/attendance', [\App\Http\Controllers\Operations\ReportController::class, 'attendance'])->name('attendance');
        Route::get('/deployments', [\App\Http\Controllers\Operations\ReportController::class, 'deployments'])->name('deployments');
        Route::get('/incidents', [\App\Http\Controllers\Operations\ReportController::class, 'incidents'])->name('incidents');
    });

    // Guard Management (view only for operations)
    Route::get('/guards', [\App\Http\Controllers\Operations\GuardController::class, 'index'])->name('guards.index');
    Route::get('/guards/{guard}', [\App\Http\Controllers\Operations\GuardController::class, 'show'])->name('guards.show');

    // Site Coverage
    Route::get('/coverage', [\App\Http\Controllers\Operations\CoverageController::class, 'index'])->name('coverage.index');
    Route::get('/coverage/sites', [\App\Http\Controllers\Operations\CoverageController::class, 'sites'])->name('coverage.sites');

    // Shift Overview
    Route::get('/shifts', [\App\Http\Controllers\Operations\ShiftController::class, 'index'])->name('shifts.index');
    Route::get('/shifts/{shift}', [\App\Http\Controllers\Operations\ShiftController::class, 'show'])->name('shifts.show');
});
