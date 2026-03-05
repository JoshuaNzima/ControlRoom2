<?php

use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])
    ->prefix('front-office')
    ->name('front-office.')
    ->group(function () {

        // Dashboard - accessible to all authenticated users with front office access
        Route::middleware(['role_or_permission:front_office|receptionist|client_service|manager|super_admin|executive_assistant|personal_assistant|assistant|front-office.dashboard.view'])
            ->group(function () {
                Route::get('/', [\App\Http\Controllers\FrontOffice\DashboardController::class, 'index'])->name('dashboard');
                Route::get('/dashboard', [\App\Http\Controllers\FrontOffice\DashboardController::class, 'index']);
                Route::get('/me', [\App\Http\Controllers\Profile\ProfileDashboardController::class, 'index'])->name('profile');
            });

        // Unified Assistant Dashboard - combines Executive & Personal duties
        Route::middleware(['role_or_permission:assistant|executive_assistant|personal_assistant|manager|super_admin|admin'])
            ->group(function () {
                Route::get('/assistant', [\App\Http\Controllers\FrontOffice\AssistantController::class, 'index'])->name('assistant');
                Route::get('/executive', [\App\Http\Controllers\FrontOffice\AssistantController::class, 'index'])->name('executive');
            });

        // API Routes for Duty Management
        Route::prefix('api')->name('api.')
            ->middleware(['role_or_permission:assistant|executive_assistant|personal_assistant|manager|super_admin|admin'])
            ->group(function () {
                // Stats
                Route::get('/stats', [\App\Http\Controllers\FrontOffice\DutyController::class, 'getStats'])->name('stats');

                // Office Duties
                Route::get('/office-duties', [\App\Http\Controllers\FrontOffice\DutyController::class, 'getOfficeDuties'])->name('office-duties.index');
                Route::post('/office-duties', [\App\Http\Controllers\FrontOffice\DutyController::class, 'storeOfficeDuty'])->name('office-duties.store');
                Route::put('/office-duties/{id}', [\App\Http\Controllers\FrontOffice\DutyController::class, 'updateOfficeDuty'])->name('office-duties.update');
                Route::delete('/office-duties/{id}', [\App\Http\Controllers\FrontOffice\DutyController::class, 'deleteOfficeDuty'])->name('office-duties.destroy');

                // Personal Duties
                Route::get('/personal-duties', [\App\Http\Controllers\FrontOffice\DutyController::class, 'getPersonalDuties'])->name('personal-duties.index');
                Route::post('/personal-duties', [\App\Http\Controllers\FrontOffice\DutyController::class, 'storePersonalDuty'])->name('personal-duties.store');
                Route::put('/personal-duties/{id}', [\App\Http\Controllers\FrontOffice\DutyController::class, 'updatePersonalDuty'])->name('personal-duties.update');
                Route::delete('/personal-duties/{id}', [\App\Http\Controllers\FrontOffice\DutyController::class, 'deletePersonalDuty'])->name('personal-duties.destroy');
            });

        // Assistant Assignment Management
        Route::middleware(['role_or_permission:super_admin|admin|manager|assistant'])
            ->prefix('assignments')
            ->name('assignments.')
            ->group(function () {
                Route::get('/', [\App\Http\Controllers\FrontOffice\AssistantAssignmentController::class, 'index'])->name('index');
                Route::post('/', [\App\Http\Controllers\FrontOffice\AssistantAssignmentController::class, 'store'])->name('store');
                Route::put('/{assignment}', [\App\Http\Controllers\FrontOffice\AssistantAssignmentController::class, 'update'])->name('update');
                Route::delete('/{assignment}', [\App\Http\Controllers\FrontOffice\AssistantAssignmentController::class, 'destroy'])->name('destroy');
                
                // API endpoints for fetching assignments
                Route::get('/api/assistant/{assistant}', [\App\Http\Controllers\FrontOffice\AssistantAssignmentController::class, 'assistantAssignments'])->name('api.assistant');
                Route::get('/api/user/{user}', [\App\Http\Controllers\FrontOffice\AssistantAssignmentController::class, 'userAssistants'])->name('api.user');
            });
    });
