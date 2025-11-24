<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::middleware(['permission:k9.view'])->prefix('k9')->name('k9.')->group(function () {
        Route::get('/dashboard', fn() => Inertia::render('K9/Dashboard'))->name('dashboard');
        Route::get('/dogs', fn() => Inertia::render('K9/Dogs'))->name('dogs');
        Route::get('/handlers', fn() => Inertia::render('K9/Handlers'))->name('handlers');
    });
});
