<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
	Route::middleware(['permission:hr.employees.view'])->prefix('hr')->name('hr.')->group(function () {
		Route::get('/dashboard', fn() => Inertia::render('HR/Dashboard'))->name('dashboard');
		Route::get('/leaves', fn() => Inertia::render('HR/Leaves'))->name('leaves');
		Route::get('/archived', fn() => Inertia::render('HR/Archived'))->name('archived');
		
		// Downs for HR visibility
		Route::get('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'index'])->name('downs.index');

		// Employees & Training
		Route::get('/employees', [\App\Http\Controllers\HR\EmployeeController::class, 'index'])->name('employees.index');
		Route::post('/guards/{guard}/promote', [\App\Http\Controllers\HR\EmployeeController::class, 'promote'])->name('guards.promote');
		Route::get('/training', [\App\Http\Controllers\HR\TrainingController::class, 'index'])->name('training');
	});

	// HR Careers Management (separate permission)
	Route::middleware(['permission:hr.careers.manage'])->prefix('hr')->name('hr.')->group(function () {
		Route::get('/jobs', [\App\Http\Controllers\HR\JobPostingController::class, 'index'])->name('jobs.index');
		Route::post('/jobs', [\App\Http\Controllers\HR\JobPostingController::class, 'store'])->name('jobs.store');
		Route::put('/jobs/{jobPosting}', [\App\Http\Controllers\HR\JobPostingController::class, 'update'])->name('jobs.update');
		Route::delete('/jobs/{jobPosting}', [\App\Http\Controllers\HR\JobPostingController::class, 'destroy'])->name('jobs.destroy');
		Route::post('/jobs/{jobPosting}/publish', [\App\Http\Controllers\HR\JobPostingController::class, 'publish'])->name('jobs.publish');
		Route::post('/jobs/{jobPosting}/unpublish', [\App\Http\Controllers\HR\JobPostingController::class, 'unpublish'])->name('jobs.unpublish');
	});

	// HR guard actions (suspension, reinstatement, dismissal)
	Route::middleware(['permission:hr.employees.manage'])->prefix('hr')->name('hr.')->group(function () {
		Route::post('/guards/{guard}/suspend', [\App\Http\Controllers\HR\GuardHRController::class, 'suspend'])->name('guards.suspend');
		Route::post('/guards/{guard}/reinstate', [\App\Http\Controllers\HR\GuardHRController::class, 'reinstate'])->name('guards.reinstate');
		Route::post('/guards/{guard}/dismiss', [\App\Http\Controllers\HR\GuardHRController::class, 'dismiss'])->name('guards.dismiss');
	});
});
