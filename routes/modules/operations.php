<?php

use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('operations')->name('operations.')->group(function () {
    // Operations Dashboard
    Route::get('/', fn() => redirect()->route('operations.control-room.dashboard'))->name('home');
    
    // Load all operations sub-modules
    foreach (glob(__DIR__ . '/operations/*.php') as $routeFile) {
        require $routeFile;
    }
});