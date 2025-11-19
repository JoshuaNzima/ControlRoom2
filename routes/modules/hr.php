<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
	Route::middleware(['permission:hr.employees.view'])->prefix('hr')->name('hr.')->group(function () {
		Route::get('/dashboard', fn() => Inertia::render('ComingSoon'))->name('dashboard');
	
		// Downs for HR visibility
		Route::get('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'index'])->name('downs.index');
	});
});
