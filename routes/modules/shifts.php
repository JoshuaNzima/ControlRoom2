<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ShiftController;

Route::middleware(['auth', 'role:supervisor'])->group(function () {
    Route::resource('shifts', ShiftController::class);
});