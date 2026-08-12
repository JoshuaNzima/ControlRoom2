<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Requisitions\RequisitionController;
use App\Http\Controllers\Requisitions\RequisitionApprovalController;
use App\Http\Controllers\Requisitions\RequisitionDisbursementController;
use App\Http\Controllers\Requisitions\RequisitionBatchController;
use App\Http\Controllers\Requisitions\RequisitionAttachmentController;
use App\Http\Controllers\Requisitions\RequisitionItemController;

Route::middleware(['auth'])
    ->prefix('requisitions')
    ->name('requisitions.')
    ->group(function () {
        Route::get('/', [RequisitionController::class, 'index'])->name('index');
        Route::post('/', [RequisitionController::class, 'store'])->name('store');
        Route::get('/summary', [RequisitionController::class, 'summary'])->name('summary');
        Route::get('/{requisition}', [RequisitionController::class, 'show'])->name('show');
        Route::post('/{requisition}/resubmit', [RequisitionController::class, 'resubmit'])->name('resubmit');
        Route::put('/{requisition}', [RequisitionController::class, 'update'])->name('update');
        Route::delete('/{requisition}', [RequisitionController::class, 'destroy'])->name('destroy');

        Route::post('/{requisition}/approve', [RequisitionApprovalController::class, 'approve'])
            ->name('approve');
        Route::post('/{requisition}/decline', [RequisitionApprovalController::class, 'decline'])
            ->name('decline');

        Route::post('/{requisition}/disburse', [RequisitionDisbursementController::class, 'disburse'])
            ->name('disburse');

        // Inline Items Management
        Route::post('/{requisition}/items', [RequisitionItemController::class, 'store'])
            ->name('items.store');
        Route::put('/{requisition}/items/{item}', [RequisitionItemController::class, 'update'])
            ->name('items.update');
        Route::delete('/{requisition}/items/{item}', [RequisitionItemController::class, 'destroy'])
            ->name('items.destroy');

        // Individual Item Approvals
        Route::post('/{requisition}/items/{item}/approve', [RequisitionItemController::class, 'approve'])
            ->name('items.approve');
        Route::post('/{requisition}/items/{item}/decline', [RequisitionItemController::class, 'decline'])
            ->name('items.decline');
        Route::post('/{requisition}/items/{item}/disburse', [RequisitionItemController::class, 'disburse'])
            ->name('items.disburse');

        // Attachments
        Route::get('/{requisition}/attachments/{attachment}', [RequisitionAttachmentController::class, 'download'])
            ->name('attachments.download');
        Route::post('/{requisition}/attachments', [RequisitionAttachmentController::class, 'store'])
            ->name('attachments.store');
        Route::delete('/{requisition}/attachments/{attachment}', [RequisitionAttachmentController::class, 'destroy'])
            ->name('attachments.destroy');

        // Daily batch compile and acknowledgement
        Route::get('/batches/today', [RequisitionBatchController::class, 'today'])
            ->name('batches.today');
        Route::post('/batches/compile-today', [RequisitionBatchController::class, 'compileToday'])
            ->name('batches.compile_today');
        Route::post('/batches/acknowledge-today', [RequisitionBatchController::class, 'acknowledgeToday'])
            ->name('batches.acknowledge_today');
        Route::post('/batches/{batch}/fund', [RequisitionBatchController::class, 'fund'])
            ->name('batches.fund');
        Route::get('/batches/today/export.csv', [RequisitionBatchController::class, 'exportTodayCsv'])
            ->name('batches.export_today_csv');
        Route::get('/batches/today/print', [RequisitionBatchController::class, 'printToday'])
            ->name('batches.print_today');

        // Batches history
        Route::get('/batches', [RequisitionBatchController::class, 'index'])
            ->name('batches.index');
        Route::get('/batches/report', [RequisitionBatchController::class, 'generateReport'])
            ->name('batches.report');
        Route::get('/batches/{batch}', [RequisitionBatchController::class, 'show'])
            ->name('batches.show');
        Route::get('/batches/{batch}/export.csv', [RequisitionBatchController::class, 'exportCsv'])
            ->name('batches.export_csv');
        Route::get('/batches/{batch}/print', [RequisitionBatchController::class, 'print'])
            ->name('batches.print');
    });
