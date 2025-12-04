<?php

use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:super_admin,asset_manager'])
    ->prefix('admin/assets')
    ->name('admin.assets.')
    ->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\AssetManagementController::class, 'index'])->name('index');

        // Equipment
        Route::get('/equipment/{equipment}/json', [\App\Http\Controllers\Admin\EquipmentController::class, 'showJson'])->name('equipment.json');
        Route::resource('equipment', \App\Http\Controllers\Admin\EquipmentController::class)->except(['create','edit','show']);

        // Vehicles
        Route::get('/vehicles/{vehicle}/json', [\App\Http\Controllers\Admin\VehicleController::class, 'showJson'])->name('vehicles.json');
        Route::resource('vehicles', \App\Http\Controllers\Admin\VehicleController::class)->except(['create','edit','show']);

        // Settings
        Route::get('/settings', [\App\Http\Controllers\Admin\AssetSettingController::class, 'index'])->name('settings');
        Route::post('/settings', [\App\Http\Controllers\Admin\AssetSettingController::class, 'update'])->name('settings.update');
    });
