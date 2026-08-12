<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Budgets\BudgetRequestController;
use App\Http\Controllers\Budgets\BudgetApprovalController;
use App\Http\Controllers\Budgets\BudgetReleaseController;

Route::middleware(['auth'])
    ->prefix('budgets')
    ->name('budgets.')
    ->group(function () {
        Route::get('/', [BudgetRequestController::class, 'index'])->name('index');
        Route::post('/', [BudgetRequestController::class, 'store'])->name('store');
        Route::get('/summary', [BudgetRequestController::class, 'summary'])->name('summary');
        Route::get('/{budget}', [BudgetRequestController::class, 'show'])->name('show');
        Route::post('/{budget}/resubmit', [BudgetRequestController::class, 'resubmit'])->name('resubmit');

        Route::post('/{budget}/approve', [BudgetApprovalController::class, 'approve'])->name('approve');
        Route::post('/{budget}/decline', [BudgetApprovalController::class, 'decline'])->name('decline');

        Route::post('/{budget}/release', [BudgetReleaseController::class, 'release'])->name('release');
    });
