<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\Guards\AssignmentController;
use App\Http\Controllers\Guards\CalendarController;
use App\Http\Controllers\Guards\CheckpointScanController;
use App\Http\Controllers\Guards\GuardController;
use App\Http\Controllers\Guards\IncidentController;
use App\Http\Controllers\Guards\OperationsController;
use App\Http\Controllers\Guards\SergeantController;
use App\Http\Controllers\Guards\SupervisorController;
use App\Http\Controllers\Guards\DownReportController;
use App\Http\Controllers\HR\ArchivedController;
use App\Http\Controllers\HR\LeaveController;
use App\Http\Controllers\Reports\ActivityLogController;
use App\Http\Controllers\Reports\ReportController;

Route::middleware(['auth'])->group(function () {

    // Supervisor routes
    Route::middleware(['permission:guards.view'])->prefix('supervisor')->name('supervisor.')->group(function () {
        Route::get('/dashboard', [SupervisorController::class, 'dashboard'])->name('dashboard');
        Route::get('/attendance', [SupervisorController::class, 'attendance'])->name('attendance');
        Route::get('/guards', [SupervisorController::class, 'guards'])->name('guards');
        Route::get('/shifts', [SupervisorController::class, 'shifts'])->name('shifts');
        Route::get('/reports', [SupervisorController::class, 'reports'])->name('reports');

        Route::get('guards/{guard}', [SupervisorController::class, 'showGuard'])->name('guards.show');

        // Attendance management
        Route::middleware(['permission:attendance.manage'])->group(function () {
            Route::post('/attendance/check-in', [SupervisorController::class, 'checkIn'])->name('attendance.check-in');
            Route::post('/attendance/check-out', [SupervisorController::class, 'checkOut'])->name('attendance.check-out');
            Route::post('/attendance/manual', [SupervisorController::class, 'manualAttendance'])->name('attendance.manual');
            Route::get('/scanner', [CheckpointScanController::class, 'showScanner'])->name('scanner.show');
            Route::post('/checkpoint/scan', [CheckpointScanController::class, 'scan'])->name('checkpoint.scan');
            Route::post('/checkpoint/clear', [CheckpointScanController::class, 'clearScan'])->name('checkpoint.clear');

            // Downs reporting
            Route::post('/downs', [DownReportController::class, 'store'])->name('downs.store');

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
    Route::get('/sergeants', [SergeantController::class, 'index'])->name('sergeants');
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
