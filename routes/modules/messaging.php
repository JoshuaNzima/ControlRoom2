<?php

use App\Http\Controllers\ControlRoom\MessagingController;

Route::middleware(['auth'])->prefix('control-room')->name('control-room.')->group(function () {
    Route::prefix('messaging')->name('messaging.')->group(function () {
        Route::get('/', [MessagingController::class, 'index'])->name('index');
        Route::post('/', [MessagingController::class, 'store'])->name('store');
        Route::get('/{conversation}', [MessagingController::class, 'show'])->name('show');
        Route::post('/{conversation}/messages', [MessagingController::class, 'storeMessage'])->name('messages.send');
        Route::post('/status', [MessagingController::class, 'updateAgentStatus'])->name('status.update');
    });
});

// Global messaging routes (system-wide access without control-room prefix)
Route::middleware(['auth'])->prefix('messaging')->name('messaging.')->group(function () {
    Route::get('/', [MessagingController::class, 'index'])->name('index');
    Route::post('/', [MessagingController::class, 'store'])->name('store');
    Route::get('/{conversation}', [MessagingController::class, 'show'])->name('show');
    Route::post('/{conversation}/messages', [MessagingController::class, 'storeMessage'])->name('messages.send');
    Route::post('/status', [MessagingController::class, 'updateAgentStatus'])->name('status.update');
});