<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
	Route::middleware(['permission:hr.employees.view'])->prefix('hr')->name('hr.')->group(function () {
		Route::get('/dashboard', fn() => Inertia::render('ComingSoon'))->name('dashboard');
		Route::get('/leaves', fn() => Inertia::render('ComingSoon'))->name('leaves');
		Route::get('/archived', fn() => Inertia::render('ComingSoon'))->name('archived');
		Route::get('/resigned', fn() => Inertia::render('ComingSoon'))->name('resigned');
		Route::get('/dismissed', fn() => Inertia::render('ComingSoon'))->name('dismissed');

		// Downs for HR visibility
		Route::get('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'index'])->name('downs.index');
	});
});
