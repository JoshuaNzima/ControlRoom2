<?php

use App\Http\Controllers\EmergencyContactController;
use Illuminate\Support\Facades\Route;

// Emergency Contacts - accessible to all authenticated users
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/emergency-contacts', [EmergencyContactController::class, 'index'])
        ->name('emergency-contacts.index');

    Route::middleware(['role:super_admin,admin'])->group(function () {
        Route::get('/emergency-contacts/create', [EmergencyContactController::class, 'create'])
            ->name('emergency-contacts.create');
        Route::post('/emergency-contacts', [EmergencyContactController::class, 'store'])
            ->name('emergency-contacts.store');
        Route::get('/emergency-contacts/{emergencyContact}/edit', [EmergencyContactController::class, 'edit'])
            ->name('emergency-contacts.edit');
        Route::put('/emergency-contacts/{emergencyContact}', [EmergencyContactController::class, 'update'])
            ->name('emergency-contacts.update');
        Route::delete('/emergency-contacts/{emergencyContact}', [EmergencyContactController::class, 'destroy'])
            ->name('emergency-contacts.destroy');
    });
});
