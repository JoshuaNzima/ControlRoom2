<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
	Route::middleware(['permission:hr.employees.view'])->prefix('hr')->name('hr.')->group(function () {
		Route::get('/dashboard', [\App\Http\Controllers\HR\DashboardController::class, 'index'])->name('dashboard');
		Route::get('/dashboard/compliance-export', [\App\Http\Controllers\HR\DashboardController::class, 'complianceExport'])->name('dashboard.compliance-export');
		Route::get('/leaves', [\App\Http\Controllers\HR\LeaveController::class, 'index'])->name('leaves');
		Route::get('/leaves/events', [\App\Http\Controllers\HR\LeaveController::class, 'events'])->name('leaves.events');
		Route::get('/archived', fn() => Inertia::render('HR/Archived'))->name('archived');
		
		// Downs for HR visibility
		Route::get('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'index'])->name('downs.index');

		// Employees & Training
		Route::get('/employees', [\App\Http\Controllers\HR\EmployeeController::class, 'index'])->name('employees.index');
		Route::post('/guards/{guard}/promote', [\App\Http\Controllers\HR\EmployeeController::class, 'promote'])->name('guards.promote');
		Route::get('/training', [\App\Http\Controllers\HR\TrainingController::class, 'index'])->name('training');
		// Medical Schemes (view)
		Route::get('/medical', [\App\Http\Controllers\HR\MedicalSchemeController::class, 'index'])->name('medical.index');
		// Pensions (view)
		Route::get('/pensions', [\App\Http\Controllers\HR\PensionController::class, 'index'])->name('pensions.index');
	});

	// HR Careers Management (separate permission)
	Route::middleware(['permission:hr.careers.manage'])->prefix('hr')->name('hr.')->group(function () {
		Route::get('/jobs', [\App\Http\Controllers\HR\JobPostingController::class, 'index'])->name('jobs.index');
		Route::post('/jobs', [\App\Http\Controllers\HR\JobPostingController::class, 'store'])->name('jobs.store');
		Route::put('/jobs/{jobPosting}', [\App\Http\Controllers\HR\JobPostingController::class, 'update'])->name('jobs.update');
		Route::delete('/jobs/{jobPosting}', [\App\Http\Controllers\HR\JobPostingController::class, 'destroy'])->name('jobs.destroy');
		Route::post('/jobs/{jobPosting}/publish', [\App\Http\Controllers\HR\JobPostingController::class, 'publish'])->name('jobs.publish');
		Route::post('/jobs/{jobPosting}/unpublish', [\App\Http\Controllers\HR\JobPostingController::class, 'unpublish'])->name('jobs.unpublish');
        Route::get('/jobs/export', [\App\Http\Controllers\HR\JobPostingController::class, 'export'])->name('jobs.export');

		// Careers subpages
		Route::get('/jobs/applicants', [\App\Http\Controllers\HR\ApplicantsController::class, 'index'])->name('jobs.applicants');
		Route::get('/jobs/interviews', [\App\Http\Controllers\HR\InterviewsController::class, 'index'])->name('jobs.interviews');
        Route::get('/jobs/applicants/export', [\App\Http\Controllers\HR\ApplicantsController::class, 'export'])->name('jobs.applicants.export');
        Route::get('/jobs/interviews/export', [\App\Http\Controllers\HR\InterviewsController::class, 'export'])->name('jobs.interviews.export');

		// Job applications
		Route::post('/job-applications', [\App\Http\Controllers\HR\JobApplicationController::class, 'store'])->name('job-applications.store');
		Route::put('/job-applications/{jobApplication}', [\App\Http\Controllers\HR\JobApplicationController::class, 'update'])->name('job-applications.update');
		Route::delete('/job-applications/{jobApplication}', [\App\Http\Controllers\HR\JobApplicationController::class, 'destroy'])->name('job-applications.destroy');

		// Interviews
		Route::post('/interviews', [\App\Http\Controllers\HR\InterviewController::class, 'store'])->name('interviews.store');
		Route::put('/interviews/{interview}', [\App\Http\Controllers\HR\InterviewController::class, 'update'])->name('interviews.update');
		Route::delete('/interviews/{interview}', [\App\Http\Controllers\HR\InterviewController::class, 'destroy'])->name('interviews.destroy');
	});

	// HR guard actions (suspension, reinstatement, dismissal)
	Route::middleware(['permission:hr.employees.manage'])->prefix('hr')->name('hr.')->group(function () {
        // Training management
        Route::post('/training/courses', [\App\Http\Controllers\HR\TrainingController::class, 'storeCourse'])->name('training.courses.store');
        Route::put('/training/courses/{course}', [\App\Http\Controllers\HR\TrainingController::class, 'updateCourse'])->name('training.courses.update');
        Route::delete('/training/courses/{course}', [\App\Http\Controllers\HR\TrainingController::class, 'destroyCourse'])->name('training.courses.destroy');
        Route::post('/training/sessions', [\App\Http\Controllers\HR\TrainingController::class, 'storeSession'])->name('training.sessions.store');
        Route::put('/training/sessions/{session}', [\App\Http\Controllers\HR\TrainingController::class, 'updateSession'])->name('training.sessions.update');
        Route::delete('/training/sessions/{session}', [\App\Http\Controllers\HR\TrainingController::class, 'destroySession'])->name('training.sessions.destroy');
        Route::post('/training/enroll', [\App\Http\Controllers\HR\TrainingController::class, 'enroll'])->name('training.enroll');
        Route::post('/training/enrollments/{enrollment}/complete', [\App\Http\Controllers\HR\TrainingController::class, 'completeEnrollment'])->name('training.enrollments.complete');
        Route::post('/training/enrollments/{enrollment}/cancel', [\App\Http\Controllers\HR\TrainingController::class, 'cancelEnrollment'])->name('training.enrollments.cancel');
		// Checklists page
		Route::get('/checklists', [\App\Http\Controllers\HR\ChecklistPageController::class, 'index'])->name('checklists.index');
		Route::post('/guards/{guard}/suspend', [\App\Http\Controllers\HR\GuardHRController::class, 'suspend'])->name('guards.suspend');
		Route::post('/guards/{guard}/reinstate', [\App\Http\Controllers\HR\GuardHRController::class, 'reinstate'])->name('guards.reinstate');
		Route::post('/guards/{guard}/dismiss', [\App\Http\Controllers\HR\GuardHRController::class, 'dismiss'])->name('guards.dismiss');
		Route::post('/guards/{guard}/set-role', [\App\Http\Controllers\HR\GuardHRController::class, 'setRole'])->name('guards.set-role');

		// On/Offboarding checklist assignment
		Route::post('/checklists/assign', [\App\Http\Controllers\HR\ChecklistAssignmentController::class, 'store'])->name('checklists.assign');
		// Checklist item update
		Route::patch('/checklists/items/{item}', [\App\Http\Controllers\HR\ChecklistController::class, 'updateItemStatus'])->name('checklists.items.update');

		// Checklist templates CRUD
		Route::post('/checklist-templates', [\App\Http\Controllers\HR\ChecklistTemplateController::class, 'store'])->name('checklist-templates.store');
		Route::put('/checklist-templates/{template}', [\App\Http\Controllers\HR\ChecklistTemplateController::class, 'update'])->name('checklist-templates.update');
		Route::delete('/checklist-templates/{template}', [\App\Http\Controllers\HR\ChecklistTemplateController::class, 'destroy'])->name('checklist-templates.destroy');
		Route::post('/checklist-templates/{template}/items', [\App\Http\Controllers\HR\ChecklistTemplateController::class, 'storeItem'])->name('checklist-template-items.store');
		Route::put('/checklist-template-items/{item}', [\App\Http\Controllers\HR\ChecklistTemplateController::class, 'updateItem'])->name('checklist-template-items.update');
		Route::delete('/checklist-template-items/{item}', [\App\Http\Controllers\HR\ChecklistTemplateController::class, 'destroyItem'])->name('checklist-template-items.destroy');

		// HR Policies management
		Route::get('/policies', [\App\Http\Controllers\HR\HrPolicyController::class, 'index'])->name('policies.index');
		Route::post('/policies', [\App\Http\Controllers\HR\HrPolicyController::class, 'store'])->name('policies.store');
		Route::put('/policies/{policy}', [\App\Http\Controllers\HR\HrPolicyController::class, 'update'])->name('policies.update');
		Route::delete('/policies/{policy}', [\App\Http\Controllers\HR\HrPolicyController::class, 'destroy'])->name('policies.destroy');
		Route::post('/policies/{policy}/toggle', [\App\Http\Controllers\HR\HrPolicyController::class, 'togglePublish'])->name('policies.toggle');
		Route::post('/policies/{policy}/files', [\App\Http\Controllers\HR\HrPolicyController::class, 'storeFile'])->name('policies.files.store');
		Route::delete('/policy-files/{file}', [\App\Http\Controllers\HR\HrPolicyController::class, 'destroyFile'])->name('policies.files.destroy');

		// HR Policy Categories
		Route::post('/policy-categories', [\App\Http\Controllers\HR\HrPolicyController::class, 'storeCategory'])->name('policy-categories.store');
		Route::put('/policy-categories/{category}', [\App\Http\Controllers\HR\HrPolicyController::class, 'updateCategory'])->name('policy-categories.update');
		Route::delete('/policy-categories/{category}', [\App\Http\Controllers\HR\HrPolicyController::class, 'destroyCategory'])->name('policy-categories.destroy');

		// Disciplinary & Grievance (phase 1: Disciplinary cases)
		Route::get('/disciplinary', [\App\Http\Controllers\HR\DisciplinaryController::class, 'index'])->name('disciplinary.index');
		Route::post('/disciplinary', [\App\Http\Controllers\HR\DisciplinaryController::class, 'store'])->name('disciplinary.store');
		Route::put('/disciplinary/{case}', [\App\Http\Controllers\HR\DisciplinaryController::class, 'update'])->name('disciplinary.update');
		Route::post('/disciplinary/{case}/schedule', [\App\Http\Controllers\HR\DisciplinaryController::class, 'schedule'])->name('disciplinary.schedule');
		Route::post('/disciplinary/{case}/outcome', [\App\Http\Controllers\HR\DisciplinaryController::class, 'outcome'])->name('disciplinary.outcome');
		Route::post('/disciplinary/{case}/close', [\App\Http\Controllers\HR\DisciplinaryController::class, 'close'])->name('disciplinary.close');

		// Benefits & Rewards (Phase 2 start)
		Route::get('/benefits', [\App\Http\Controllers\HR\HrBenefitController::class, 'index'])->name('benefits.index');
		Route::post('/benefits', [\App\Http\Controllers\HR\HrBenefitController::class, 'store'])->name('benefits.store');
		Route::put('/benefits/{benefit}', [\App\Http\Controllers\HR\HrBenefitController::class, 'update'])->name('benefits.update');
		Route::delete('/benefits/{benefit}', [\App\Http\Controllers\HR\HrBenefitController::class, 'destroy'])->name('benefits.destroy');
		Route::post('/benefits/{benefit}/enroll', [\App\Http\Controllers\HR\HrBenefitController::class, 'enroll'])->name('benefits.enroll');
		Route::post('/benefit-enrollments/{enrollment}/cancel', [\App\Http\Controllers\HR\HrBenefitController::class, 'cancelEnrollment'])->name('benefits.enrollments.cancel');
		Route::get('/benefits/enrollments/export', [\App\Http\Controllers\HR\HrBenefitController::class, 'enrollmentsExport'])->name('benefits.enrollments.export');

		// Medical Scheme (manage)
		Route::post('/medical/schemes', [\App\Http\Controllers\HR\MedicalSchemeController::class, 'storeScheme'])->name('medical.schemes.store');
		Route::put('/medical/schemes/{scheme}', [\App\Http\Controllers\HR\MedicalSchemeController::class, 'updateScheme'])->name('medical.schemes.update');
		Route::delete('/medical/schemes/{scheme}', [\App\Http\Controllers\HR\MedicalSchemeController::class, 'destroyScheme'])->name('medical.schemes.destroy');
		Route::post('/medical/memberships', [\App\Http\Controllers\HR\MedicalSchemeController::class, 'storeMembership'])->name('medical.memberships.store');
		Route::put('/medical/memberships/{membership}', [\App\Http\Controllers\HR\MedicalSchemeController::class, 'updateMembership'])->name('medical.memberships.update');
		Route::delete('/medical/memberships/{membership}', [\App\Http\Controllers\HR\MedicalSchemeController::class, 'destroyMembership'])->name('medical.memberships.destroy');
		Route::get('/medical/memberships/export', [\App\Http\Controllers\HR\MedicalSchemeController::class, 'membershipsExport'])->name('medical.memberships.export');

		// Pensions (manage)
		Route::post('/pensions/schemes', [\App\Http\Controllers\HR\PensionController::class, 'storeScheme'])->name('pensions.schemes.store');
		Route::put('/pensions/schemes/{scheme}', [\App\Http\Controllers\HR\PensionController::class, 'updateScheme'])->name('pensions.schemes.update');
		Route::delete('/pensions/schemes/{scheme}', [\App\Http\Controllers\HR\PensionController::class, 'destroyScheme'])->name('pensions.schemes.destroy');
		Route::post('/pensions/enrollments', [\App\Http\Controllers\HR\PensionController::class, 'storeEnrollment'])->name('pensions.enrollments.store');
		Route::put('/pensions/enrollments/{enrollment}', [\App\Http\Controllers\HR\PensionController::class, 'updateEnrollment'])->name('pensions.enrollments.update');
		Route::delete('/pensions/enrollments/{enrollment}', [\App\Http\Controllers\HR\PensionController::class, 'destroyEnrollment'])->name('pensions.enrollments.destroy');
		Route::get('/pensions/enrollments/export', [\App\Http\Controllers\HR\PensionController::class, 'enrollmentsExport'])->name('pensions.enrollments.export');

		// Compensation (Phase 2)
		Route::get('/compensation', [\App\Http\Controllers\HR\CompensationController::class, 'index'])->name('compensation.index');
		Route::post('/compensation/bands', [\App\Http\Controllers\HR\CompensationController::class, 'storeBand'])->name('compensation.bands.store');
		Route::put('/compensation/bands/{band}', [\App\Http\Controllers\HR\CompensationController::class, 'updateBand'])->name('compensation.bands.update');
		Route::delete('/compensation/bands/{band}', [\App\Http\Controllers\HR\CompensationController::class, 'destroyBand'])->name('compensation.bands.destroy');
		Route::post('/compensation/changes/request', [\App\Http\Controllers\HR\CompensationController::class, 'requestChange'])->name('compensation.changes.request');
		Route::post('/compensation/changes/{change}/approve', [\App\Http\Controllers\HR\CompensationController::class, 'approve'])->name('compensation.changes.approve');
		Route::post('/compensation/changes/{change}/decline', [\App\Http\Controllers\HR\CompensationController::class, 'decline'])->name('compensation.changes.decline');
		Route::get('/compensation/changes/export', [\App\Http\Controllers\HR\CompensationController::class, 'changesExport'])->name('compensation.changes.export');

		// Safety (Phase 2)
		Route::get('/safety', [\App\Http\Controllers\HR\SafetyController::class, 'index'])->name('safety.index');
		Route::post('/safety/incidents', [\App\Http\Controllers\HR\SafetyController::class, 'storeIncident'])->name('safety.incidents.store');
		Route::post('/safety/incidents/{incident}/resolve', [\App\Http\Controllers\HR\SafetyController::class, 'resolveIncident'])->name('safety.incidents.resolve');
		Route::post('/safety/near-misses', [\App\Http\Controllers\HR\SafetyController::class, 'storeNearMiss'])->name('safety.near-misses.store');
		Route::get('/safety/incidents/export', [\App\Http\Controllers\HR\SafetyController::class, 'incidentsExport'])->name('safety.incidents.export');

		// Leave & Roster management
		Route::post('/leaves/holidays', [\App\Http\Controllers\HR\LeaveController::class, 'storeHoliday'])->name('leaves.holidays.store');
		Route::put('/leaves/holidays/{holiday}', [\App\Http\Controllers\HR\LeaveController::class, 'updateHoliday'])->name('leaves.holidays.update');
		Route::delete('/leaves/holidays/{holiday}', [\App\Http\Controllers\HR\LeaveController::class, 'destroyHoliday'])->name('leaves.holidays.destroy');

		Route::post('/leaves/off-days', [\App\Http\Controllers\HR\LeaveController::class, 'storeOffDay'])->name('leaves.off-days.store');
		Route::put('/leaves/off-days/{offDay}', [\App\Http\Controllers\HR\LeaveController::class, 'updateOffDay'])->name('leaves.off-days.update');
		Route::delete('/leaves/off-days/{offDay}', [\App\Http\Controllers\HR\LeaveController::class, 'destroyOffDay'])->name('leaves.off-days.destroy');
	});
});
