<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AssetHandoverController;

// Inventory check routes - accessible to roles that can update guard compliance
Route::middleware(['auth', 'role:super_admin,admin,hr,control_room_operator,operations_officer'])
    ->prefix('assets')
    ->name('assets.')
    ->group(function () {
        Route::post('/equipment/check-inventory', [\App\Http\Controllers\Admin\EquipmentController::class, 'checkInventory'])->name('equipment.check-inventory');
        Route::post('/equipment/quick-create', [\App\Http\Controllers\Admin\EquipmentController::class, 'quickCreateFromCompliance'])->name('equipment.quick-create');
    });

Route::middleware(['auth', 'role:super_admin,asset_manager'])
    ->prefix('assets')
    ->name('assets.')
    ->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\AssetManagementController::class, 'index'])->name('index');

        Route::get('/me', [\App\Http\Controllers\Profile\ProfileDashboardController::class, 'index'])->name('profile');

        // Equipment
        Route::get('/equipment/{equipment}/json', [\App\Http\Controllers\Admin\EquipmentController::class, 'showJson'])->name('equipment.json');
        Route::resource('equipment', \App\Http\Controllers\Admin\EquipmentController::class)->except(['create','edit','show']);

        // Vehicles
        Route::get('/vehicles/{vehicle}/json', [\App\Http\Controllers\Admin\VehicleController::class, 'showJson'])->name('vehicles.json');
        Route::resource('vehicles', \App\Http\Controllers\Admin\VehicleController::class)->except(['create','edit','show']);

        // Handovers
        Route::get('/handovers', [AssetHandoverController::class, 'index'])->name('handovers.index');
        Route::post('/handovers', [AssetHandoverController::class, 'store'])->name('handovers.store');
        Route::post('/handovers/{handover}/return', [AssetHandoverController::class, 'returnAsset'])->name('handovers.return');

        // Vehicle Dispatches (Assets Manager)
        Route::prefix('dispatches')->name('dispatches.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\VehicleDispatchController::class, 'index'])->name('index');
            Route::post('/', [\App\Http\Controllers\Admin\VehicleDispatchController::class, 'store'])->name('store');
            Route::post('/{dispatch}/return', [\App\Http\Controllers\Admin\VehicleDispatchController::class, 'returnVehicle'])->name('return');
        });

        // Utilization logs
        Route::prefix('utilization')->name('utilization.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\VehicleUtilizationController::class, 'index'])->name('index');
            Route::post('/', [\App\Http\Controllers\Admin\VehicleUtilizationController::class, 'store'])->name('store');
            Route::put('/{log}', [\App\Http\Controllers\Admin\VehicleUtilizationController::class, 'update'])->name('update');
            Route::delete('/{log}', [\App\Http\Controllers\Admin\VehicleUtilizationController::class, 'destroy'])->name('destroy');
            Route::get('/export', [\App\Http\Controllers\Admin\VehicleUtilizationController::class, 'export'])->name('export');
        });

        // Fuel logs
        Route::prefix('fuel')->name('fuel.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\VehicleFuelLogController::class, 'index'])->name('index');
            Route::post('/', [\App\Http\Controllers\Admin\VehicleFuelLogController::class, 'store'])->name('store');
            Route::put('/{log}', [\App\Http\Controllers\Admin\VehicleFuelLogController::class, 'update'])->name('update');
            Route::delete('/{log}', [\App\Http\Controllers\Admin\VehicleFuelLogController::class, 'destroy'])->name('destroy');
            Route::get('/export', [\App\Http\Controllers\Admin\VehicleFuelLogController::class, 'export'])->name('export');
        });

        // Maintenance logs
        Route::prefix('maintenance')->name('maintenance.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\VehicleMaintenanceLogController::class, 'index'])->name('index');
            Route::post('/', [\App\Http\Controllers\Admin\VehicleMaintenanceLogController::class, 'store'])->name('store');
            Route::put('/{log}', [\App\Http\Controllers\Admin\VehicleMaintenanceLogController::class, 'update'])->name('update');
            Route::delete('/{log}', [\App\Http\Controllers\Admin\VehicleMaintenanceLogController::class, 'destroy'])->name('destroy');
            Route::get('/export', [\App\Http\Controllers\Admin\VehicleMaintenanceLogController::class, 'export'])->name('export');
        });

        // Settings
        Route::get('/settings', [\App\Http\Controllers\Admin\AssetSettingController::class, 'index'])->name('settings');
        Route::post('/settings', [\App\Http\Controllers\Admin\AssetSettingController::class, 'update'])->name('settings.update');
    });
