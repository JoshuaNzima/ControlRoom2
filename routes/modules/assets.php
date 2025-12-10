<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AssetHandoverController;

Route::middleware(['auth', 'role:super_admin,asset_manager'])
    ->prefix('assets')
    ->name('assets.')
    ->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\AssetManagementController::class, 'index'])->name('index');

        // Equipment
        Route::get('/equipment/{equipment}/json', [\App\Http\Controllers\Admin\EquipmentController::class, 'showJson'])->name('equipment.json');
        Route::resource('equipment', \App\Http\Controllers\Admin\EquipmentController::class)->except(['create','edit','show']);

        // Vehicles
        Route::get('/vehicles/{vehicle}/json', [\App\Http\Controllers\Admin\VehicleController::class, 'showJson'])->name('vehicles.json');
        Route::resource('vehicles', \App\Http\Controllers\Admin\VehicleController::class)->except(['create','edit','show']);

        // Handovers
        Route::post('/handovers', [AssetHandoverController::class, 'store'])->name('handovers.store');
        Route::post('/handovers/{handover}/return', [AssetHandoverController::class, 'returnAsset'])->name('handovers.return');

        // Vehicle Dispatches (Assets Manager)
        Route::prefix('dispatches')->name('dispatches.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\VehicleDispatchController::class, 'index'])->name('index');
            Route::post('/', [\App\Http\Controllers\Admin\VehicleDispatchController::class, 'store'])->name('store');
            Route::post('/{dispatch}/return', [\App\Http\Controllers\Admin\VehicleDispatchController::class, 'returnVehicle'])->name('return');
        });

        // Settings
        Route::get('/settings', [\App\Http\Controllers\Admin\AssetSettingController::class, 'index'])->name('settings');
        Route::post('/settings', [\App\Http\Controllers\Admin\AssetSettingController::class, 'update'])->name('settings.update');
    });
