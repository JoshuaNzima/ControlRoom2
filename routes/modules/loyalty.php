<?php

use App\Http\Controllers\Admin\LoyaltyPointsController as AdminLoyaltyPointsController;
use App\Http\Controllers\Client\LoyaltyPointsController as ClientLoyaltyPointsController;
use App\Http\Controllers\Finance\LoyaltyPointsController as FinanceLoyaltyPointsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::middleware(['role:client'])->prefix('client/loyalty')->name('client.loyalty.')->group(function () {
        Route::get('/', [ClientLoyaltyPointsController::class, 'dashboard'])->name('dashboard');
        Route::get('/summary', [ClientLoyaltyPointsController::class, 'getSummary'])->name('api.summary');
        Route::get('/rewards', [ClientLoyaltyPointsController::class, 'getRewards'])->name('api.rewards');
        Route::post('/request-redemption', [ClientLoyaltyPointsController::class, 'requestRedemption'])->name('request-redemption');
        Route::get('/redemptions', [ClientLoyaltyPointsController::class, 'redemptions'])->name('redemptions');
        Route::post('/redemptions/{redemption}/cancel', [ClientLoyaltyPointsController::class, 'cancelRedemption'])->name('cancel');
    });

    Route::middleware(['role:finance_officer|finance|finance_manager|accountant|admin|super_admin'])
        ->prefix('finance/loyalty')
        ->name('finance.loyalty.')
        ->group(function () {
            Route::get('/', [FinanceLoyaltyPointsController::class, 'dashboard'])->name('dashboard');
            Route::get('/clients/{client}', [FinanceLoyaltyPointsController::class, 'clientDetails'])->name('client');
            Route::get('/pending', [FinanceLoyaltyPointsController::class, 'pendingRedemptions'])->name('pending');
            Route::post('/redemptions/{redemption}/approve', [FinanceLoyaltyPointsController::class, 'approveRedemption'])->name('approve');
            Route::post('/redemptions/{redemption}/reject', [FinanceLoyaltyPointsController::class, 'rejectRedemption'])->name('reject');
            Route::get('/export', [FinanceLoyaltyPointsController::class, 'exportReport'])->name('export');
        });

    Route::middleware(['role:admin|super_admin'])->prefix('admin/loyalty')->name('admin.loyalty.')->group(function () {
        Route::get('/', [AdminLoyaltyPointsController::class, 'dashboard'])->name('dashboard');
        Route::get('/rules', [AdminLoyaltyPointsController::class, 'rules'])->name('rules');
        Route::post('/rules', [AdminLoyaltyPointsController::class, 'storeRule'])->name('rules.store');
        Route::get('/tiers', [AdminLoyaltyPointsController::class, 'tiers'])->name('tiers');
        Route::post('/tiers', [AdminLoyaltyPointsController::class, 'storeTier'])->name('tiers.store');
        Route::get('/rewards', [AdminLoyaltyPointsController::class, 'rewards'])->name('rewards');
        Route::post('/rewards', [AdminLoyaltyPointsController::class, 'storeReward'])->name('rewards.store');
        Route::post('/clients/{client}/award-points', [AdminLoyaltyPointsController::class, 'awardPoints'])->name('award-points');
        Route::post('/clients/{client}/redeem', [AdminLoyaltyPointsController::class, 'redeemReward'])->name('redeem');
        Route::get('/clients/{client}/summary', [AdminLoyaltyPointsController::class, 'clientSummary'])->name('client-summary');
        Route::post('/redemptions/{redemption}/approve', [AdminLoyaltyPointsController::class, 'approveRedemption'])->name('approve');
        Route::post('/redemptions/{redemption}/reject', [AdminLoyaltyPointsController::class, 'rejectRedemption'])->name('reject');
        Route::get('/export', [AdminLoyaltyPointsController::class, 'exportReport'])->name('export');
    });
});
