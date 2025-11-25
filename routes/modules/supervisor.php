<?php

use App\Http\Controllers\SupervisorQRCodesController;

Route::middleware(['auth', 'role:supervisor'])->group(function () {
    Route::get('/supervisor/qr-codes', [SupervisorQRCodesController::class, 'index'])->name('supervisor.qr-codes');
    Route::get('/supervisor/qr-codes/download-bulk', [SupervisorQRCodesController::class, 'downloadBulk'])->name('supervisor.qr-codes.download-bulk');
    Route::get('/supervisor/qr-codes/download-saved', [SupervisorQRCodesController::class, 'downloadSaved'])->name('supervisor.qr-codes.download-saved');
    Route::get('/supervisor/qr-codes/list-saved', [SupervisorQRCodesController::class, 'listSaved'])->name('supervisor.qr-codes.list-saved');
});