<?php

use App\Http\Controllers\SupervisorQRCodesController;

Route::middleware(['auth', 'role:supervisor'])->group(function () {
    Route::get('/supervisor/qr-codes', [SupervisorQRCodesController::class, 'index'])->name('supervisor.qr-codes');
    Route::get('/supervisor/qr-codes/download-bulk', [SupervisorQRCodesController::class, 'downloadBulk'])->name('supervisor.qr-codes.download-bulk');
});