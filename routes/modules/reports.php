<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReportsController;

Route::middleware(['auth', 'role:admin,supervisor'])->group(function () {
    Route::get('reports', [ReportsController::class, 'index'])->name('reports.index');
    Route::post('reports/generate', [ReportsController::class, 'generate'])->name('reports.generate');
});