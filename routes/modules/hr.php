<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
	Route::middleware(['permission:hr.employees.view'])->prefix('hr')->name('hr.')->group(function () {
		Route::get('/dashboard', fn() => Inertia::render('HR/Dashboard'))->name('dashboard');
	
		// Downs for HR visibility
		Route::get('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'index'])->name('downs.index');

		// Employees & Training
		Route::get('/employees', [\App\Http\Controllers\HR\EmployeeController::class, 'index'])->name('employees.index');
		Route::post('/guards/{guard}/promote', [\App\Http\Controllers\HR\EmployeeController::class, 'promote'])->name('guards.promote');
		Route::get('/training', [\App\Http\Controllers\HR\TrainingController::class, 'index'])->name('training');
	});
});
