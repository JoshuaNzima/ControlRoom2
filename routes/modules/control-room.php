<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    // Allow admins by role OR users with the specific permission
    Route::middleware(['role_or_permission:admin|control.dashboard.view'])->prefix('control-room')->name('control-room.')->group(function () {
		Route::get('/dashboard', fn() => Inertia::render('ComingSoon'))->name('dashboard');
		Route::get('/incidents', fn() => Inertia::render('ComingSoon'))->name('incidents');
		Route::get('/alerts', fn() => Inertia::render('ComingSoon'))->name('alerts');
		// Downs
		Route::get('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'index'])->name('downs.index');
		Route::post('/downs', [\App\Http\Controllers\ControlRoom\DownController::class, 'store'])->name('downs.store');
		Route::post('/downs/{down}/escalate', [\App\Http\Controllers\ControlRoom\DownController::class, 'escalate'])->name('downs.escalate');
		Route::post('/downs/{down}/resolve', [\App\Http\Controllers\ControlRoom\DownController::class, 'resolve'])->name('downs.resolve');
	});
});
