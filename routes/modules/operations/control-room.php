<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::prefix('control-room')->name('control-room.')->group(function () {
    // Dashboard - requires general control room access
    Route::get('/dashboard', [\App\Http\Controllers\Operations\ControlRoom\DashboardController::class, 'index'])
        ->middleware('role_or_permission:admin|control.dashboard.view')
        ->name('dashboard');
    
    // Monitoring - requires specific monitoring permission
    Route::get('/monitoring', fn() => Inertia::render('Operations/ControlRoom/Monitoring'))
        ->middleware('permission:monitoring.view')
        ->name('monitoring');

    // Monitoring data endpoint used by the SPA to load live data asynchronously
    Route::get('/monitoring/data', [\App\Http\Controllers\Operations\ControlRoom\MonitoringController::class, 'index'])->name('monitoring.data');

    // Operations Officer routes
    Route::middleware(['auth', 'role_or_permission:admin|control_room_operator|operations_officer|operations.dashboard.view'])
        ->prefix('operations-officer')
        ->name('operations.officer.')
        ->group(function () {
            Route::get('/', [\App\Http\Controllers\Operations\ControlRoom\OperationsOfficerController::class, 'index'])->name('dashboard');
            Route::get('/alerts', [\App\Http\Controllers\Operations\ControlRoom\OperationsOfficerController::class, 'alerts'])->name('alerts');
            Route::get('/cameras', [\App\Http\Controllers\Operations\ControlRoom\OperationsOfficerController::class, 'cameras'])->name('cameras');
            Route::get('/zones', [\App\Http\Controllers\Operations\ControlRoom\OperationsOfficerController::class, 'zones'])->name('zones');
            Route::get('/shifts', [\App\Http\Controllers\Operations\ControlRoom\OperationsOfficerController::class, 'shifts'])->name('shifts');
        });

    // Operations Manager routes (manager-level dashboard)
    Route::middleware(['auth', 'role_or_permission:admin|manager|operations.dashboard.view'])
        ->prefix('operations-manager')
        ->name('operations.manager.')
        ->group(function () {
            Route::get('/', [\App\Http\Controllers\Operations\ControlRoom\OperationsManagerController::class, 'index'])->name('dashboard');
            Route::get('/approvals', [\App\Http\Controllers\Operations\ControlRoom\OperationsManagerController::class, 'approvals'])->name('approvals');
            Route::get('/reports/export', [\App\Http\Controllers\Operations\ControlRoom\OperationsManagerController::class, 'exportReports'])->name('reports.export');
        });

    // Zone Management
    Route::resource('zones', \App\Http\Controllers\Operations\ControlRoom\ZoneController::class)->only(['index','store','update','destroy']);
    Route::get('zones/{zone}/assign', [\App\Http\Controllers\Operations\ControlRoom\ZoneController::class, 'assign'])->name('zones.assign');
    Route::post('zones/{zone}/assignments', [\App\Http\Controllers\Operations\ControlRoom\ZoneController::class, 'storeAssignment'])->name('zones.assignments.store');
    Route::delete('zones/{zone}/assignments/{assignment}', [\App\Http\Controllers\Operations\ControlRoom\ZoneController::class, 'unassign'])->name('zones.assignments.destroy');
    Route::get('zones/{zone}/reports', [\App\Http\Controllers\Operations\ControlRoom\ZoneController::class, 'reports'])->name('zones.reports');
    Route::get('zones/{zone}/map', [\App\Http\Controllers\Operations\ControlRoom\ZoneController::class, 'map'])->name('zones.map');
    Route::get('/settings', fn() => Inertia::render('Operations/ControlRoom/Settings'))->name('settings');
    
    // Clients Management (view-only, assignments)
    Route::get('/clients', [\App\Http\Controllers\Operations\ControlRoom\ClientsController::class, 'index'])->name('clients');
    Route::get('/clients/{client}', [\App\Http\Controllers\Operations\ControlRoom\ClientsController::class, 'show'])->name('clients.show');
    Route::post('/clients/{client}/assign-guard', [\App\Http\Controllers\Operations\ControlRoom\ClientsController::class, 'assignGuard'])->name('clients.assign-guard');
    Route::post('/clients/{client}/assign-supervisor', [\App\Http\Controllers\Operations\ControlRoom\ClientsController::class, 'assignSupervisor'])->name('clients.assign-supervisor');

    // Incidents Management
    Route::resource('incidents', \App\Http\Controllers\Operations\ControlRoom\IncidentController::class);
    Route::post('incidents/{incident}/escalate', [\App\Http\Controllers\Operations\ControlRoom\IncidentController::class, 'escalate'])->name('incidents.escalate');
    Route::post('incidents/{incident}/resolve', [\App\Http\Controllers\Operations\ControlRoom\IncidentController::class, 'resolve'])->name('incidents.resolve');
    Route::post('incidents/{incident}/assign', [\App\Http\Controllers\Operations\ControlRoom\IncidentController::class, 'assign'])->name('incidents.assign');
    Route::post('incidents/{incident}/comments', [\App\Http\Controllers\Operations\ControlRoom\IncidentCommentController::class, 'store'])->name('incidents.comments.store');
    Route::delete('incidents/comments/{comment}', [\App\Http\Controllers\Operations\ControlRoom\IncidentCommentController::class, 'destroy'])->name('incidents.comments.destroy');
    
    // Alerts Management
    Route::get('/alerts', [\App\Http\Controllers\Operations\ControlRoom\AlertController::class, 'index'])->name('alerts');
    Route::post('alerts/{alert}/acknowledge', [\App\Http\Controllers\Operations\ControlRoom\AlertController::class, 'acknowledge'])->name('alerts.acknowledge');
    Route::post('alerts/{alert}/resolve', [\App\Http\Controllers\Operations\ControlRoom\AlertController::class, 'resolve'])->name('alerts.resolve');
    Route::post('alerts/send-emergency', [\App\Http\Controllers\Operations\ControlRoom\AlertController::class, 'sendEmergency'])->name('alerts.send-emergency');
    
    // Shift Management
    Route::resource('shifts', \App\Http\Controllers\Operations\ControlRoom\ShiftController::class);
    Route::post('shifts/{shift}/assign-guard', [\App\Http\Controllers\Operations\ControlRoom\ShiftController::class, 'assignGuard'])->name('shifts.assign-guard');
    Route::delete('shifts/{shift}/unassign-guard/{guard}', [\App\Http\Controllers\Operations\ControlRoom\ShiftController::class, 'unassignGuard'])->name('shifts.unassign-guard');
    Route::get('shifts/{shift}/schedule', [\App\Http\Controllers\Operations\ControlRoom\ShiftController::class, 'schedule'])->name('shifts.schedule');
    
    // Control Room specific management routes (decoupled from Supervisor controllers)
    Route::get('/guards', [\App\Http\Controllers\Operations\ControlRoom\GuardsController::class, 'index'])->name('guards');
    Route::get('/assignments', [\App\Http\Controllers\Operations\ControlRoom\AssignmentsController::class, 'index'])->name('assignments.index');
    Route::get('/reports', [\App\Http\Controllers\Operations\ControlRoom\ReportsController::class, 'index'])->name('reports');

    // Assistive component to append to Zone Commander activities
    Route::get('/assist/zone-commander', [\App\Http\Controllers\Operations\ControlRoom\AssistZoneCommanderController::class, 'index'])->name('assist.zone-commander');
    
    // Camera Management
    Route::resource('cameras', \App\Http\Controllers\Operations\ControlRoom\CameraController::class);
    Route::get('cameras/{camera}/recordings', [\App\Http\Controllers\Operations\ControlRoom\CameraController::class, 'getRecordings'])->name('cameras.recordings.index');
    Route::get('recordings/{recording}/download', [\App\Http\Controllers\Operations\ControlRoom\CameraController::class, 'downloadRecording'])->name('cameras.recordings.download');
    Route::get('recordings/{recording}/thumbnail', [\App\Http\Controllers\Operations\ControlRoom\CameraController::class, 'recordingThumbnail'])->name('cameras.recordings.thumbnail');
    Route::post('cameras/{camera}/alerts/{alert}/acknowledge', [\App\Http\Controllers\Operations\ControlRoom\CameraController::class, 'acknowledgeAlert'])->name('cameras.alerts.acknowledge');
    Route::post('cameras/{camera}/alerts/{alert}/resolve', [\App\Http\Controllers\Operations\ControlRoom\CameraController::class, 'resolveAlert'])->name('cameras.alerts.resolve');
    Route::post('cameras/{camera}/test', [\App\Http\Controllers\Operations\ControlRoom\CameraController::class, 'testConnection'])->name('cameras.test');
    Route::post('cameras/{camera}/restart', [\App\Http\Controllers\Operations\ControlRoom\CameraController::class, 'restart'])->name('cameras.restart');
    
    // Flags Management
    Route::resource('flags', \App\Http\Controllers\Operations\ControlRoom\FlagController::class);
    Route::post('flags/{flag}/acknowledge', [\App\Http\Controllers\Operations\ControlRoom\FlagController::class, 'acknowledge'])->name('flags.acknowledge');
    Route::post('flags/{flag}/resolve', [\App\Http\Controllers\Operations\ControlRoom\FlagController::class, 'resolve'])->name('flags.resolve');
    Route::post('flags/{flag}/escalate', [\App\Http\Controllers\Operations\ControlRoom\FlagController::class, 'escalate'])->name('flags.escalate');
    
    // Tickets Management
    Route::resource('tickets', \App\Http\Controllers\Operations\ControlRoom\TicketController::class);
    Route::post('tickets/{ticket}/comments', [\App\Http\Controllers\Operations\ControlRoom\TicketController::class, 'addComment'])->name('tickets.comments.store');
    Route::post('tickets/{ticket}/assign', [\App\Http\Controllers\Operations\ControlRoom\TicketController::class, 'assign'])->name('tickets.assign');
    Route::post('tickets/{ticket}/close', [\App\Http\Controllers\Operations\ControlRoom\TicketController::class, 'close'])->name('tickets.close');
    Route::post('tickets/{ticket}/reopen', [\App\Http\Controllers\Operations\ControlRoom\TicketController::class, 'reopen'])->name('tickets.reopen');
    
    // Downs
    Route::get('/downs', [\App\Http\Controllers\Operations\ControlRoom\DownController::class, 'index'])->name('downs.index');
    Route::post('/downs', [\App\Http\Controllers\Operations\ControlRoom\DownController::class, 'store'])->name('downs.store');
    Route::get('/downs/{down}', [\App\Http\Controllers\Operations\ControlRoom\DownController::class, 'show'])->name('downs.show');
    Route::get('/downs/{down}/edit', [\App\Http\Controllers\Operations\ControlRoom\DownController::class, 'edit'])->name('downs.edit');
    Route::put('/downs/{down}', [\App\Http\Controllers\Operations\ControlRoom\DownController::class, 'update'])->name('downs.update');
    Route::delete('/downs/{down}', [\App\Http\Controllers\Operations\ControlRoom\DownController::class, 'destroy'])->name('downs.destroy');
    Route::post('/downs/{down}/escalate', [\App\Http\Controllers\Operations\ControlRoom\DownController::class, 'escalate'])->name('downs.escalate');
    Route::post('/downs/{down}/resolve', [\App\Http\Controllers\Operations\ControlRoom\DownController::class, 'resolve'])->name('downs.resolve');
});