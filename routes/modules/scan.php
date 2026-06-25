<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Guards\CheckpointScanController;
use App\Http\Controllers\Guards\SiteScanController;

/*
|--------------------------------------------------------------------------
| Shared QR Scanning Routes (All Authenticated Users)
|--------------------------------------------------------------------------
|
| These routes allow any authenticated user to scan QR codes for attendance,
| site verification, and checkpoint patrols. The specific actions available
| depend on the user's role and permissions.
|
*/

Route::middleware(['auth'])->prefix('scan')->name('scan.')->group(function () {
    // QR Scanner page (accessible to all authenticated users)
    Route::get('/scanner', [CheckpointScanController::class, 'showScanner'])
        ->name('scanner');

    // Checkpoint scanning (any authenticated user can scan checkpoints)
    Route::post('/checkpoint', [CheckpointScanController::class, 'scan'])
        ->name('checkpoint');

    // Site scanning via QR code (any authenticated user can scan sites)
    Route::get('/site', [SiteScanController::class, 'scan'])
        ->name('site');

    // Clear scan lock (any authenticated user can clear their own scan)
    Route::post('/clear', [CheckpointScanController::class, 'clearScan'])
        ->name('clear');

    // Site scan clear (dedicated route for site scan clearing)
    Route::post('/site/clear', [SiteScanController::class, 'clearScan'])
        ->name('site.clear');

    // Report a site not found via QR — allows supervisor to type site name when QR is missing/damaged
    Route::post('/report-not-found', [SiteScanController::class, 'reportNotFound'])
        ->name('report-not-found');
});
