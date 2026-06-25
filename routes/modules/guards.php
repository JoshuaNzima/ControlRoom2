<?php

use App\Http\Controllers\Admin\ClientController;
use App\Http\Controllers\Guards\AssignmentController;
use App\Http\Controllers\Guards\CalendarController;
use App\Http\Controllers\Guards\GuardController;
use App\Http\Controllers\Guards\IncidentController;
use App\Http\Controllers\Guards\OperationsController;
use App\Http\Controllers\Guards\SupervisorController;
use App\Http\Controllers\Guards\SupervisorAssignmentController;
use App\Http\Controllers\Guards\DownReportController;
use App\Http\Controllers\HR\ArchivedController;
use App\Http\Controllers\HR\LeaveController;
use App\Http\Controllers\Reports\ActivityLogController;
use App\Http\Controllers\Reports\ReportController;

use App\Http\Controllers\Guards\SiteScanController;

Route::middleware(['auth'])->group(function () {

    // Supervisor routes (also accessible by sergeants with roaming permissions)
    Route::middleware(['role:supervisor|sergeant'])->prefix('supervisor')->name('supervisor.')->group(function () {
        // Dashboard now points directly to Overview (avoids redirect flash)
        Route::get('/dashboard', [SupervisorController::class, 'overview'])->name('dashboard');
        Route::get('/me', [\App\Http\Controllers\Supervisor\ProfileController::class, 'index'])->name('profile');
        Route::get('/overview', [SupervisorController::class, 'overview'])->name('overview');
        Route::get('/analytics', [SupervisorController::class, 'analytics'])->name('analytics');
        Route::get('/attendance', [SupervisorController::class, 'attendance'])->name('attendance');
        Route::get('/guards', [SupervisorController::class, 'guards'])->name('guards');
        Route::get('/shifts', [SupervisorController::class, 'shifts'])->name('shifts');
        Route::get('/reports', [SupervisorController::class, 'reports'])->name('reports');
        Route::get('/reports/pdf', [SupervisorController::class, 'reportsPdf'])->name('reports.pdf');
        Route::get('/reports/csv', [SupervisorController::class, 'reportsCsv'])->name('reports.csv');
        Route::post('/reports/email', [SupervisorController::class, 'reportsEmail'])->name('reports.email');

        Route::get('guards/{guard}', [SupervisorController::class, 'showGuard'])->name('guards.show');

        // Assignments management (Supervisor) - legacy routes, use web.php routes instead
        // Route::get('/assignments', [SupervisorAssignmentController::class, 'index'])->name('assignments');
        // Route::post('/assignments/assign', [SupervisorAssignmentController::class, 'assign'])->name('assignments.assign');
        // Route::delete('/assignments/unassign/{id}', [SupervisorAssignmentController::class, 'unassign'])->name('assignments.unassign');

        // Attendance management
        Route::middleware(['permission:attendance.manage'])->group(function () {
            Route::post('/attendance/check-in', [SupervisorController::class, 'checkIn'])->name('attendance.check-in');
            Route::post('/attendance/check-out', [SupervisorController::class, 'checkOut'])->name('attendance.check-out');
            Route::post('/attendance/manual', [SupervisorController::class, 'manualAttendance'])->name('attendance.manual');
            Route::post('/attendance/bulk-check-in', [SupervisorController::class, 'bulkCheckIn'])->name('attendance.bulk-check-in');
            Route::post('/attendance/bulk-check-out', [SupervisorController::class, 'bulkCheckOut'])->name('attendance.bulk-check-out');
            // Scanner now uses shared /scan/* routes - see routes/modules/scan.php
            // Site QR scan (for attendance site-lock) - supports both route param and QR code lookup
            Route::post('/site/scan', [SiteScanController::class, 'scan'])->name('site.scan.qr');
            Route::get('/site/scan/{site}', [SiteScanController::class, 'scan'])->name('site.scan');
            Route::post('/site/clear', [SiteScanController::class, 'clearScan'])->name('site.clear');

            // Downs reporting
            Route::post('/downs', [DownReportController::class, 'store'])->name('downs.store');

            // Incentives - view my incentives
            Route::get('/incentives', [\App\Http\Controllers\Admin\IncentiveController::class, 'myIncentives'])->name('incentives.index');
            Route::get('/incentives/{record}', [\App\Http\Controllers\Admin\IncentiveController::class, 'showMyIncentive'])->name('incentives.show');

            // Quick incident report
            Route::post('/incident/quick', [SupervisorController::class, 'quickIncident'])->name('incident.quick');

        });

    });

});

// Guards Management Routes
Route::middleware(['permission:guards.view'])->prefix('guards')->name('guards.')->group(function () {
    Route::get('/', [GuardController::class, 'index'])->name('index');
    Route::get('/assignments', [AssignmentController::class, 'index'])->name('assignments');
    Route::get('/incidents', [IncidentController::class, 'index'])->name('incidents');
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar');
    Route::get('/operations', [OperationsController::class, 'index'])->name('operations');
});

// Client Routes
Route::middleware(['permission:clients.view'])->prefix('clients')->name('clients.')->group(function () {
    Route::get('/', [ClientController::class, 'index'])->name('index');
});

// Report Routes
Route::middleware(['permission:reports.view'])->prefix('reports')->name('reports.')->group(function () {
    Route::get('/', [ReportController::class, 'index'])->name('index');
    Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs');
});

// HR Routes
Route::middleware(['permission:hr.leaves.view'])->prefix('hr')->name('hr.')->group(function () {
    Route::get('/leaves', [LeaveController::class, 'index'])->name('leaves');
    Route::get('/archived', [ArchivedController::class, 'index'])->name('archived');
});
