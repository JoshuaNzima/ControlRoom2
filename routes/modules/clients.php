<?php

use App\Http\Controllers\ClientDashboardController;
use App\Http\Controllers\ClientsController;
use App\Http\Controllers\ClientSitesController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('clients')->name('clients.')->group(function () {
    // Dashboard
    Route::get('/', [ClientDashboardController::class, 'index'])->name('dashboard');
    
    // Clients CRUD
    Route::get('/list', [ClientsController::class, 'index'])->name('index');
    Route::get('/create', [ClientsController::class, 'create'])->name('create');
    Route::post('/', [ClientsController::class, 'store'])->name('store');
    Route::get('/{client}', [ClientsController::class, 'show'])->name('show');
    Route::get('/{client}/edit', [ClientsController::class, 'edit'])->name('edit');
    Route::put('/{client}', [ClientsController::class, 'update'])->name('update');
    Route::delete('/{client}', [ClientsController::class, 'destroy'])->name('destroy');
});

// Client Sites
Route::middleware(['auth'])->prefix('client-sites')->name('client-sites.')->group(function () {
    Route::get('/', [ClientSitesController::class, 'index'])->name('index');
    Route::post('/', [ClientSitesController::class, 'store'])->name('store');
    Route::put('/{site}', [ClientSitesController::class, 'update'])->name('update');
    Route::delete('/{site}', [ClientSitesController::class, 'destroy'])->name('destroy');
});
