<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SupervisorQRCodesController;

Route::middleware(['auth'])->group(function () {
    // Allow specific roles or users with permission (include admin role)
    Route::middleware(['role_or_permission:control_room_operator|operations_officer|supervisor|manager|admin|super_admin|zone_commander|control.dashboard.view'])->prefix('control-room')->name('control-room.')->group(function () {
		Route::get('/dashboard', [\App\Http\Controllers\ControlRoomDashboardController::class, 'index'])->name('dashboard');
		Route::get('/me', [\App\Http\Controllers\Profile\ProfileDashboardController::class, 'index'])->name('profile');
		Route::get('/monitoring', [\App\Http\Controllers\ControlRoom\MonitoringController::class, 'index'])->name('monitoring');
		Route::get('/monitoring/data', [\App\Http\Controllers\ControlRoom\MonitoringController::class, 'data'])->name('monitoring.data');
		Route::get('/monitoring/events', [\App\Http\Controllers\ControlRoom\MonitoringController::class, 'events'])->name('monitoring.events');
		Route::get('/monitoring/guards', [\App\Http\Controllers\ControlRoom\MonitoringController::class, 'guards'])->name('monitoring.guards');
		Route::get('/monitoring/incidents', [\App\Http\Controllers\ControlRoom\MonitoringController::class, 'incidents'])->name('monitoring.incidents');
		Route::get('/monitoring/site/{site}', [\App\Http\Controllers\ControlRoom\MonitoringController::class, 'siteDetails'])->name('monitoring.site');
		// Zones Management
        Route::resource('zones', \App\Http\Controllers\ControlRoom\ZoneController::class)->only(['index','store','update','destroy']);
        Route::get('zones/{zone}/assign', [\App\Http\Controllers\ControlRoom\ZoneController::class, 'assign'])->name('zones.assign');
        Route::post('zones/{zone}/assignments', [\App\Http\Controllers\ControlRoom\ZoneController::class, 'storeAssignment'])->name('zones.assignments.store');
        Route::post('zones/{zone}/assignments/{assignment}/end', [\App\Http\Controllers\ControlRoom\ZoneController::class, 'endAssignment'])->name('zones.assignments.end');
        Route::delete('zones/{zone}/assignments/{assignment}', [\App\Http\Controllers\ControlRoom\ZoneController::class, 'unassign'])->name('zones.assignments.destroy');
        Route::get('zones/{zone}/reports', [\App\Http\Controllers\ControlRoom\ZoneController::class, 'reports'])->name('zones.reports');
        Route::get('zones/{zone}/map', [\App\Http\Controllers\ControlRoom\ZoneController::class, 'map'])->name('zones.map');
		Route::get('/settings', [\App\Http\Controllers\ControlRoom\SettingsController::class, 'index'])->name('settings');
		Route::post('/settings', [\App\Http\Controllers\ControlRoom\SettingsController::class, 'update'])->name('settings.update');
		
		// QR Code Management (Control Room - bulk generation)
		Route::prefix('qr-codes')->name('qr-codes.')->middleware(['role_or_permission:control_room_operator|operations_officer|manager|super_admin'])->group(function () {
			Route::get('/', [SupervisorQRCodesController::class, 'index'])->name('index');
			Route::get('/download-bulk', [SupervisorQRCodesController::class, 'downloadBulk'])->name('download-bulk');
			Route::get('/download-saved', [SupervisorQRCodesController::class, 'downloadSaved'])->name('download-saved');
			Route::get('/list-saved', [SupervisorQRCodesController::class, 'listSaved'])->name('list-saved');
		});
		
		// Clients Management (view-only, assignments)
		Route::get('/clients', [\App\Http\Controllers\ControlRoom\ClientsController::class, 'index'])->name('clients');
		Route::get('/clients/{client}', [\App\Http\Controllers\ControlRoom\ClientsController::class, 'show'])->name('clients.show');
		Route::post('/clients/{client}/assign-guard', [\App\Http\Controllers\ControlRoom\ClientsController::class, 'assignGuard'])->name('clients.assign-guard');
		Route::post('/clients/{client}/assign-supervisor', [\App\Http\Controllers\ControlRoom\ClientsController::class, 'assignSupervisor'])->name('clients.assign-supervisor');
		Route::post('/clients/{client}/assign-sergeant', [\App\Http\Controllers\ControlRoom\ClientsController::class, 'assignSergeant'])->name('clients.assign-sergeant');
		Route::post('/clients/{client}/unassign-sergeant', [\App\Http\Controllers\ControlRoom\ClientsController::class, 'unassignSergeant'])->name('clients.unassign-sergeant');
		// Lightweight JSON for active client sites (for assignment pickers)
		Route::get('/clients/sites/json', [\App\Http\Controllers\ControlRoom\ClientsController::class, 'sitesJson'])->name('clients.sites.json');
		// Generate QR code for a specific client site (includes client name and GPS coords)
		Route::get('/clients/sites/{site}/qr-code', [\App\Http\Controllers\ControlRoom\ClientsController::class, 'siteQr'])
			->middleware(['role_or_permission:control_room_operator|operations_officer|manager|super_admin'])
			->name('clients.sites.qr');
		// Printable QR page with branding
		Route::get('/clients/sites/{site}/qr-print', [\App\Http\Controllers\ControlRoom\ClientsController::class, 'siteQrPrint'])
			->middleware(['role_or_permission:control_room_operator|operations_officer|manager|super_admin'])
			->name('clients.sites.qr-print');

		// Incidents Management
		Route::get('incidents/{incident}/pdf', [\App\Http\Controllers\ControlRoom\IncidentController::class, 'pdf'])->name('incidents.pdf');
		Route::get('incidents/{incident}/print', [\App\Http\Controllers\ControlRoom\IncidentController::class, 'print'])->name('incidents.print');
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
		Route::get('shifts/required-guards', [\App\Http\Controllers\ControlRoom\ShiftController::class, 'requiredGuards'])->name('shifts.required-guards');
		Route::post('shifts/{shift}/assign-guard', [\App\Http\Controllers\ControlRoom\ShiftController::class, 'assignGuard'])->name('shifts.assign-guard');
		Route::delete('shifts/{shift}/unassign-guard/{guard}', [\App\Http\Controllers\ControlRoom\ShiftController::class, 'unassignGuard'])->name('shifts.unassign-guard');
		Route::get('shifts/{shift}/schedule', [\App\Http\Controllers\ControlRoom\ShiftController::class, 'schedule'])->name('shifts.schedule');

		// Roster (Control Room manages guard off-days; holidays visible via events)
		Route::prefix('roster')->name('roster.')->group(function () {
			Route::get('/', [\App\Http\Controllers\ControlRoom\RosterController::class, 'index'])->name('index');
			Route::get('/weekly', [\App\Http\Controllers\ControlRoom\RosterController::class, 'weekly'])->name('weekly');
			Route::get('/weekly/data', [\App\Http\Controllers\ControlRoom\RosterController::class, 'weeklyData'])->name('weekly.data');
			Route::post('/manual-shifts/upsert', [\App\Http\Controllers\ControlRoom\RosterController::class, 'upsertManualShift'])
				->middleware(['role_or_permission:control_room_operator|operations_officer|manager|super_admin'])
				->name('manual-shifts.upsert');
			Route::post('/manual-shifts/delete', [\App\Http\Controllers\ControlRoom\RosterController::class, 'deleteManualShift'])
				->middleware(['role_or_permission:control_room_operator|operations_officer|manager|super_admin'])
				->name('manual-shifts.delete');
			Route::post('/weekly/reuse', [\App\Http\Controllers\ControlRoom\RosterController::class, 'reuseWeeklyRelief'])->name('weekly.reuse');
			Route::get('/events', [\App\Http\Controllers\HR\LeaveController::class, 'events'])->name('events');
			Route::post('/off-days', [\App\Http\Controllers\HR\LeaveController::class, 'storeOffDay'])->name('off-days.store');
			Route::put('/off-days/{offDay}', [\App\Http\Controllers\HR\LeaveController::class, 'updateOffDay'])->name('off-days.update');
			Route::delete('/off-days/{offDay}', [\App\Http\Controllers\HR\LeaveController::class, 'destroyOffDay'])->name('off-days.destroy');
			Route::post('/generate-shifts', [\App\Http\Controllers\ControlRoom\RosterController::class, 'generateShifts'])->name('generate-shifts');
			Route::post('/relief', [\App\Http\Controllers\ControlRoom\RosterController::class, 'assignRelief'])->name('relief.assign');
			Route::post('/relief/bulk', [\App\Http\Controllers\ControlRoom\RosterController::class, 'assignReliefBulk'])->name('relief.assign-bulk');
			Route::post('/relief/delete', [\App\Http\Controllers\ControlRoom\RosterController::class, 'deleteRelief'])->name('relief.delete');
			Route::post('/off-days/bulk', [\App\Http\Controllers\ControlRoom\RosterController::class, 'offDaysBulk'])->name('off-days.bulk');
			Route::post('/manual-entry', [\App\Http\Controllers\ControlRoom\RosterController::class, 'manualEntry'])
				->middleware(['role_or_permission:control_room_operator|operations_officer|manager|super_admin'])
				->name('manual-entry');
			Route::post('/manual-entry-bulk', [\App\Http\Controllers\ControlRoom\RosterController::class, 'manualEntryBulk'])
				->middleware(['role_or_permission:control_room_operator|operations_officer|manager|super_admin'])
				->name('manual-entry-bulk');

			// Relief bundles (6 sites + 1 reliever)
			Route::get('/bundles', [\App\Http\Controllers\ControlRoom\RosterController::class, 'bundles'])->name('bundles');
			Route::post('/bundles', [\App\Http\Controllers\ControlRoom\RosterController::class, 'storeBundle'])->name('bundles.store');
			Route::put('/bundles/{bundle}', [\App\Http\Controllers\ControlRoom\RosterController::class, 'updateBundle'])->name('bundles.update');
			Route::delete('/bundles/{bundle}', [\App\Http\Controllers\ControlRoom\RosterController::class, 'destroyBundle'])->name('bundles.destroy');
			Route::post('/bundles/{bundle}/apply-week', [\App\Http\Controllers\ControlRoom\RosterController::class, 'applyBundleWeek'])->name('bundles.apply-week');
		});
		
		        // Control Room specific management routes (decoupled from Supervisor controllers)
        Route::get('/guards', [\App\Http\Controllers\ControlRoom\GuardsController::class, 'index'])->name('guards');
        // Guard management (create/update/delete), assignments and exports in Control Room
        Route::prefix('guards')->name('guards.')->group(function () {
            Route::get('/export', [\App\Http\Controllers\ControlRoom\GuardsController::class, 'export'])->name('export');
            Route::get('/search', [\App\Http\Controllers\ControlRoom\GuardsController::class, 'search'])->name('search');
            Route::get('/{guard}/json', [\App\Http\Controllers\ControlRoom\GuardsController::class, 'showJson'])->name('json');
            Route::post('/', [\App\Http\Controllers\ControlRoom\GuardManageController::class, 'store'])
                ->middleware(['role_or_permission:operations_officer|manager|control_room_operator|super_admin'])
                ->name('store');
            Route::put('/{guard}', [\App\Http\Controllers\ControlRoom\GuardManageController::class, 'update'])
                ->middleware(['role_or_permission:operations_officer|manager|control_room_operator|super_admin'])
                ->name('update');
            Route::delete('/{guard}', [\App\Http\Controllers\ControlRoom\GuardManageController::class, 'destroy'])
                ->middleware(['role_or_permission:operations_officer|manager|super_admin'])
                ->name('destroy');
            Route::post('/assign-supervisor', [\App\Http\Controllers\ControlRoom\GuardManageController::class, 'assignSupervisor'])
                ->middleware(['role_or_permission:operations_officer|manager|control_room_operator|super_admin'])
                ->name('assign-supervisor');
            Route::post('/unassign-supervisor', [\App\Http\Controllers\ControlRoom\GuardManageController::class, 'unassignSupervisor'])
                ->middleware(['role_or_permission:operations_officer|manager|control_room_operator|super_admin'])
                ->name('unassign-supervisor');
            Route::post('/assign-site', [\App\Http\Controllers\ControlRoom\GuardManageController::class, 'assignToSite'])
                ->middleware(['role_or_permission:operations_officer|manager|control_room_operator|super_admin'])
                ->name('assign-site');
            Route::post('/unassign-site', [\App\Http\Controllers\ControlRoom\GuardManageController::class, 'unassignFromSite'])
                ->middleware(['role_or_permission:operations_officer|manager|control_room_operator|super_admin'])
                ->name('unassign-site');

            // Status actions
            Route::post('/{guard}/suspend', [\App\Http\Controllers\ControlRoom\GuardManageController::class, 'suspend'])
                ->middleware(['role_or_permission:operations_officer|manager|hr|hr_manager|super_admin|zone_commander'])
                ->name('suspend');
            Route::post('/{guard}/reinstate', [\App\Http\Controllers\ControlRoom\GuardManageController::class, 'reinstate'])
                ->middleware(['role_or_permission:operations_officer|manager|hr|hr_manager|super_admin|zone_commander'])
                ->name('reinstate');
            Route::post('/{guard}/dismiss', [\App\Http\Controllers\ControlRoom\GuardManageController::class, 'dismiss'])
                ->middleware(['role_or_permission:operations_officer|manager|hr|hr_manager|super_admin|zone_commander'])
                ->name('dismiss');
            Route::post('/{guard}/abscond', [\App\Http\Controllers\ControlRoom\GuardManageController::class, 'abscond'])
                ->middleware(['role_or_permission:operations_officer|manager|hr|hr_manager|super_admin|zone_commander'])
                ->name('abscond');
        });
		Route::get('/assignments', [\App\Http\Controllers\ControlRoom\AssignmentsController::class, 'index'])->name('assignments.index');
		Route::get('/reports', [\App\Http\Controllers\ControlRoom\ReportsController::class, 'index'])->name('reports');
		Route::get('/clients', [\App\Http\Controllers\ControlRoom\ClientsController::class, 'index'])->name('clients');

		// Assistive component to append to Zone Commander activities
		Route::get('/assist/zone-commander', [\App\Http\Controllers\ControlRoom\AssistZoneCommanderController::class, 'index'])->name('assist.zone-commander');
		
		// Camera Management
		Route::resource('cameras', \App\Http\Controllers\ControlRoom\CameraController::class)->only(['index','store','show','update','destroy']);
		Route::get('cameras/{camera}/recordings', [\App\Http\Controllers\ControlRoom\CameraController::class, 'getRecordings'])->name('cameras.recordings.index');
		Route::get('recordings/{recording}/download', [\App\Http\Controllers\ControlRoom\CameraController::class, 'downloadRecording'])->name('cameras.recordings.download');
		Route::post('cameras/{camera}/alerts/{alert}/acknowledge', [\App\Http\Controllers\ControlRoom\CameraController::class, 'acknowledgeAlert'])->name('cameras.alerts.acknowledge');
		Route::post('cameras/{camera}/alerts/{alert}/resolve', [\App\Http\Controllers\ControlRoom\CameraController::class, 'resolveAlert'])->name('cameras.alerts.resolve');
		Route::post('cameras/{camera}/test', [\App\Http\Controllers\ControlRoom\CameraController::class, 'testConnection'])->name('cameras.test');
		Route::post('cameras/{camera}/restart', [\App\Http\Controllers\ControlRoom\CameraController::class, 'restart'])->name('cameras.restart');
		
		// NVR/DVR Device Management
		Route::prefix('cameras/nvrs')->name('cameras.nvrs.')->group(function () {
			Route::get('/', [\App\Http\Controllers\ControlRoom\NvrDeviceController::class, 'index'])->name('index');
			Route::post('/', [\App\Http\Controllers\ControlRoom\NvrDeviceController::class, 'store'])->name('store');
			Route::get('/{nvr}', [\App\Http\Controllers\ControlRoom\NvrDeviceController::class, 'show'])->name('show');
			Route::put('/{nvr}', [\App\Http\Controllers\ControlRoom\NvrDeviceController::class, 'update'])->name('update');
			Route::delete('/{nvr}', [\App\Http\Controllers\ControlRoom\NvrDeviceController::class, 'destroy'])->name('destroy');
			Route::post('/{nvr}/test', [\App\Http\Controllers\ControlRoom\NvrDeviceController::class, 'testConnection'])->name('test');
			Route::post('/{nvr}/import', [\App\Http\Controllers\ControlRoom\NvrDeviceController::class, 'importCameras'])->name('import');
			Route::post('/{nvr}/sync', [\App\Http\Controllers\ControlRoom\NvrDeviceController::class, 'syncAllChannels'])->name('sync');
			Route::get('/{nvr}/channels', [\App\Http\Controllers\ControlRoom\NvrDeviceController::class, 'getAvailableChannels'])->name('channels');
			Route::post('/{nvr}/quick-import', [\App\Http\Controllers\ControlRoom\NvrDeviceController::class, 'quickImport'])->name('quick-import');
		});
		
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

		// Vehicle Dispatches
		Route::prefix('dispatches')->name('dispatches.')->group(function () {
			Route::get('/', [\App\Http\Controllers\ControlRoom\VehicleDispatchController::class, 'index'])->name('index');
			Route::post('/', [\App\Http\Controllers\ControlRoom\VehicleDispatchController::class, 'store'])->name('store');
			Route::post('/{dispatch}/return', [\App\Http\Controllers\ControlRoom\VehicleDispatchController::class, 'returnVehicle'])->name('return');
		});
		
		// Downs
		Route::get('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'index'])->name('downs.index');
		Route::post('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'store'])->name('downs.store');
		Route::get('/downs/{down}', [\App\Http\Controllers\ControlRoom\DownController::class, 'show'])->name('downs.show');
		Route::get('/downs/{down}/edit', [\App\Http\Controllers\ControlRoom\DownController::class, 'edit'])->name('downs.edit');
		Route::put('/downs/{down}', [\App\Http\Controllers\ControlRoom\DownController::class, 'update'])->name('downs.update');
		Route::delete('/downs/{down}', [\App\Http\Controllers\ControlRoom\DownController::class, 'destroy'])->name('downs.destroy');
		Route::post('/downs/{down}/escalate', [\App\Http\Controllers\ControlRoom\DownController::class, 'escalate'])->name('downs.escalate');
		Route::post('/downs/{down}/resolve', [\App\Http\Controllers\ControlRoom\DownController::class, 'resolve'])->name('downs.resolve');
		Route::post('/downs/{down}/abscond', [\App\Http\Controllers\ControlRoom\DownController::class, 'abscond'])->name('downs.abscond');

		// Live Monitoring
		Route::get('/live/scans', [\App\Http\Controllers\ControlRoom\LiveMonitoringController::class, 'getRecentScans'])->name('live.scans');
		Route::get('/live/attendance', [\App\Http\Controllers\ControlRoom\LiveMonitoringController::class, 'getRecentAttendance'])->name('live.attendance');
		Route::get('/live/stats', [\App\Http\Controllers\ControlRoom\LiveMonitoringController::class, 'getLiveStats'])->name('live.stats');
		Route::get('/live/locations', [\App\Http\Controllers\ControlRoom\LiveMonitoringController::class, 'getGuardLocations'])->name('live.locations');
		Route::get('/live/alerts', [\App\Http\Controllers\ControlRoom\LiveMonitoringController::class, 'getAttendanceAlerts'])->name('live.alerts');

		// GPS mismatch incidents log
		Route::get('/gps-mismatch-incidents', [\App\Http\Controllers\ControlRoom\GPSMismatchIncidentController::class, 'index'])
			->name('gps-mismatch-incidents.index');

		Route::prefix('attendance')->name('attendance.')->middleware(['role_or_permission:control_room_operator|operations_officer|manager|super_admin'])->group(function () {
			Route::get('/', [\App\Http\Controllers\ControlRoom\AttendanceController::class, 'index'])->name('index');
			Route::get('/{attendance}/edit', [\App\Http\Controllers\ControlRoom\AttendanceController::class, 'edit'])->name('edit');
			Route::put('/{attendance}', [\App\Http\Controllers\ControlRoom\AttendanceController::class, 'update'])->name('update');
			Route::post('/mark-present', [\App\Http\Controllers\ControlRoom\AttendanceController::class, 'markPresent'])->name('mark-present');
			Route::post('/mark-absent', [\App\Http\Controllers\ControlRoom\AttendanceController::class, 'markAbsent'])->name('mark-absent');
			Route::post('/mark-covered', [\App\Http\Controllers\ControlRoom\AttendanceController::class, 'markCovered'])->name('mark-covered');
		});

		// Public Intake Triage
		Route::prefix('triage')->name('triage.')->group(function () {
			Route::get('/intakes', [\App\Http\Controllers\ControlRoom\PublicIntakeTriageController::class, 'index'])->name('intakes.index');
			Route::get('/intakes/{intake}', [\App\Http\Controllers\ControlRoom\PublicIntakeTriageController::class, 'show'])->name('intakes.show');
			Route::post('/intakes/{intake}/convert', [\App\Http\Controllers\ControlRoom\PublicIntakeTriageController::class, 'convert'])->name('intakes.convert');
		});
	});
});
