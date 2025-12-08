<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Requisitions\RequisitionController;
use App\Http\Controllers\Requisitions\RequisitionApprovalController;
use App\Http\Controllers\Requisitions\RequisitionDisbursementController;

Route::middleware(['auth'])
    ->prefix('requisitions')
    ->name('requisitions.')
    ->group(function () {
        Route::get('/', [RequisitionController::class, 'index'])->name('index');
        Route::post('/', [RequisitionController::class, 'store'])->name('store');
        Route::get('/summary', [RequisitionController::class, 'summary'])->name('summary');
        Route::get('/{requisition}', [RequisitionController::class, 'show'])->name('show');
        Route::post('/{requisition}/resubmit', [RequisitionController::class, 'resubmit'])->name('resubmit');

        Route::post('/{requisition}/approve', [RequisitionApprovalController::class, 'approve'])
            ->name('approve');
        Route::post('/{requisition}/decline', [RequisitionApprovalController::class, 'decline'])
            ->name('decline');

        Route::post('/{requisition}/disburse', [RequisitionDisbursementController::class, 'disburse'])
            ->name('disburse');
    });
