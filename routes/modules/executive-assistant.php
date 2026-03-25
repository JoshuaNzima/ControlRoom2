<?php

use App\Http\Controllers\ExecutiveAssistant\PettyCashController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:executive_assistant,super_admin'])
    ->prefix('executive/petty-cash')
    ->name('executive.petty-cash.')
    ->group(function () {
        Route::get('/', [PettyCashController::class, 'index'])->name('index');
        Route::post('/', [PettyCashController::class, 'store'])->name('store');
        Route::put('/{entry}', [PettyCashController::class, 'update'])->name('update');
        Route::post('/{entry}/approve', [PettyCashController::class, 'approve'])->name('approve');
        Route::post('/{entry}/reject', [PettyCashController::class, 'reject'])->name('reject');
        Route::delete('/{entry}', [PettyCashController::class, 'destroy'])->name('destroy');
        Route::get('/reports', [PettyCashController::class, 'reports'])->name('reports');
        Route::post('/sync-to-finance', [PettyCashController::class, 'syncToFinance'])->name('sync-to-finance');
    });
