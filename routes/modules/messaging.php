<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ControlRoom\MessagingController;

Route::middleware(['auth'])->prefix('control-room')->name('control-room.')->group(function () {
    Route::prefix('messaging')->name('messaging.')->group(function () {
        Route::get('/', [MessagingController::class, 'index'])->name('index');
        Route::post('/', [MessagingController::class, 'store'])->name('store');
        Route::get('/{conversation}', [MessagingController::class, 'show'])->name('show');
        Route::post('/{conversation}/messages', [MessagingController::class, 'storeMessage'])->name('messages.send');
    });
});

// Global messaging routes (system-wide access without control-room prefix)
Route::middleware(['auth'])->prefix('messaging')->name('messaging.')->group(function () {
    Route::get('/', [MessagingController::class, 'index'])->name('index');
    Route::post('/', [MessagingController::class, 'store'])->name('store');
    Route::get('/{conversation}', [MessagingController::class, 'show'])->name('show');
    Route::post('/{conversation}/messages', [MessagingController::class, 'storeMessage'])->name('messages.send');
});

// Role-specific messaging routes for easier link targeting (map to same controller)
Route::middleware(['auth'])->prefix('messaging/admin')->name('messaging.admin.')->group(function () {
    Route::get('/', [MessagingController::class, 'index'])->name('index');
    Route::get('/{conversation}', [MessagingController::class, 'show'])->name('show');
});

Route::middleware(['auth'])->prefix('messaging/guards')->name('messaging.guards.')->group(function () {
    Route::get('/', [MessagingController::class, 'index'])->name('index');
    Route::get('/{conversation}', [MessagingController::class, 'show'])->name('show');
});