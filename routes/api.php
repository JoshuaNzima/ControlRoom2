<?php

use App\Http\Controllers\Api\NotificationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notifications/counts', [NotificationController::class, 'counts'])->name('api.notifications.counts');
});