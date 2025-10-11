<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    // Allow admins by role OR users with the specific permission
    Route::middleware(['role_or_permission:admin|control.dashboard.view'])->prefix('control-room')->name('control-room.')->group(function () {
		Route::get('/dashboard', [\App\Http\Controllers\ControlRoomDashboardController::class, 'index'])->name('dashboard');
		Route::get('/monitoring', fn() => Inertia::render('ControlRoom/Monitoring'))->name('monitoring');
		Route::get('/zones', fn() => Inertia::render('ControlRoom/Zones'))->name('zones');
		Route::get('/settings', fn() => Inertia::render('ControlRoom/Settings'))->name('settings');
		
		// Incidents Management
		Route::resource('incidents', \App\Http\Controllers\ControlRoom\IncidentController::class);
		Route::post('incidents/{incident}/escalate', [\App\Http\Controllers\ControlRoom\IncidentController::class, 'escalate'])->name('incidents.escalate');
		Route::post('incidents/{incident}/resolve', [\App\Http\Controllers\ControlRoom\IncidentController::class, 'resolve'])->name('incidents.resolve');
		Route::post('incidents/{incident}/assign', [\App\Http\Controllers\ControlRoom\IncidentController::class, 'assign'])->name('incidents.assign');
		
		// Alerts Management
		Route::get('/alerts', [\App\Http\Controllers\ControlRoom\AlertController::class, 'index'])->name('alerts');
		Route::post('alerts/{alert}/acknowledge', [\App\Http\Controllers\ControlRoom\AlertController::class, 'acknowledge'])->name('alerts.acknowledge');
		Route::post('alerts/{alert}/resolve', [\App\Http\Controllers\ControlRoom\AlertController::class, 'resolve'])->name('alerts.resolve');
		Route::post('alerts/send-emergency', [\App\Http\Controllers\ControlRoom\AlertController::class, 'sendEmergency'])->name('alerts.send-emergency');
		
		// Shift Management
		Route::resource('shifts', \App\Http\Controllers\ControlRoom\ShiftController::class);
		Route::post('shifts/{shift}/assign-guard', [\App\Http\Controllers\ControlRoom\ShiftController::class, 'assignGuard'])->name('shifts.assign-guard');
		Route::delete('shifts/{shift}/unassign-guard/{guard}', [\App\Http\Controllers\ControlRoom\ShiftController::class, 'unassignGuard'])->name('shifts.unassign-guard');
		Route::get('shifts/{shift}/schedule', [\App\Http\Controllers\ControlRoom\ShiftController::class, 'schedule'])->name('shifts.schedule');
		
		// Control Room specific management routes
		Route::get('/guards', [\App\Http\Controllers\Guards\SupervisorController::class, 'guards'])->name('guards');
		Route::get('/assignments', [\App\Http\Controllers\Guards\AssignmentController::class, 'index'])->name('assignments.index');
		Route::get('/reports', [\App\Http\Controllers\Guards\SupervisorController::class, 'reports'])->name('reports');
		Route::get('/clients', [\App\Http\Controllers\ClientsController::class, 'index'])->name('clients');
		
		// Camera Management
		Route::resource('cameras', \App\Http\Controllers\ControlRoom\CameraController::class);
		Route::get('cameras/{camera}/recordings', [\App\Http\Controllers\ControlRoom\CameraController::class, 'getRecordings'])->name('cameras.recordings.index');
		Route::get('recordings/{recording}/download', [\App\Http\Controllers\ControlRoom\CameraController::class, 'downloadRecording'])->name('cameras.recordings.download');
		Route::post('cameras/{camera}/alerts/{alert}/acknowledge', [\App\Http\Controllers\ControlRoom\CameraController::class, 'acknowledgeAlert'])->name('cameras.alerts.acknowledge');
		Route::post('cameras/{camera}/alerts/{alert}/resolve', [\App\Http\Controllers\ControlRoom\CameraController::class, 'resolveAlert'])->name('cameras.alerts.resolve');
		Route::post('cameras/{camera}/test', [\App\Http\Controllers\ControlRoom\CameraController::class, 'testConnection'])->name('cameras.test');
		Route::post('cameras/{camera}/restart', [\App\Http\Controllers\ControlRoom\CameraController::class, 'restart'])->name('cameras.restart');
		
		// Flags Management
		Route::resource('flags', \App\Http\Controllers\ControlRoom\FlagController::class);
		Route::post('flags/{flag}/acknowledge', [\App\Http\Controllers\ControlRoom\FlagController::class, 'acknowledge'])->name('flags.acknowledge');
		Route::post('flags/{flag}/resolve', [\App\Http\Controllers\ControlRoom\FlagController::class, 'resolve'])->name('flags.resolve');
		Route::post('flags/{flag}/escalate', [\App\Http\Controllers\ControlRoom\FlagController::class, 'escalate'])->name('flags.escalate');
		
		// Tickets Management
		Route::resource('tickets', \App\Http\Controllers\ControlRoom\TicketController::class);
		Route::post('tickets/{ticket}/comments', [\App\Http\Controllers\ControlRoom\TicketController::class, 'addComment'])->name('tickets.comments.store');
		Route::post('tickets/{ticket}/assign', [\App\Http\Controllers\ControlRoom\TicketController::class, 'assign'])->name('tickets.assign');
		Route::post('tickets/{ticket}/close', [\App\Http\Controllers\ControlRoom\TicketController::class, 'close'])->name('tickets.close');
		Route::post('tickets/{ticket}/reopen', [\App\Http\Controllers\ControlRoom\TicketController::class, 'reopen'])->name('tickets.reopen');
		
		// Downs
		Route::get('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'index'])->name('downs.index');
		Route::post('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'store'])->name('downs.store');
		Route::post('/downs/{down}/escalate', [\App\Http\Controllers\ControlRoom\DownController::class, 'escalate'])->name('downs.escalate');
		Route::post('/downs/{down}/resolve', [\App\Http\Controllers\ControlRoom\DownController::class, 'resolve'])->name('downs.resolve');
	});
});
