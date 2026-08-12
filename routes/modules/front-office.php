<?php

use App\Http\Controllers\FrontOffice\DashboardController;
use App\Http\Controllers\FrontOffice\CalendarController;
use App\Http\Controllers\FrontOffice\VisitorController;
use App\Http\Controllers\FrontOffice\MessageController;
use App\Http\Controllers\FrontOffice\ProfileController;
use App\Http\Controllers\FrontOffice\RequisitionController;
use App\Http\Controllers\FrontOffice\TaskController;
use Illuminate\Support\Facades\Route;

// Front Office module - 3 roles with permission-based access:
// - Executive Assistant: Full access (calendar, visitors, tasks, messages, reports)
// - Receptionist: Visitors, messages, basic calendar view
// - Personal Assistant: Calendar, tasks, messages for assigned executives

Route::middleware(['auth'])
    ->prefix('front-office')
    ->name('front-office.')
    ->group(function () {

        // All front office roles can access dashboard
        Route::middleware(['role:executive_assistant|receptionist|personal_assistant|admin|super_admin'])
            ->group(function () {
                Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
                Route::get('/dashboard', [DashboardController::class, 'index']);
                
                // Profile
                Route::get('/me', [ProfileController::class, 'index'])->name('profile');
                Route::put('/me', [ProfileController::class, 'update'])->name('profile.update');
                Route::post('/me/password', [ProfileController::class, 'updatePassword'])->name('password.update');
                
                // Requisitions - All users can view and create
                Route::get('/requisitions', [RequisitionController::class, 'index'])->name('requisitions.index');
                Route::post('/requisitions', [RequisitionController::class, 'store'])->name('requisitions.store');
                Route::get('/requisitions/{requisition}', [RequisitionController::class, 'show'])->name('requisitions.show');
            });

        // Calendar Management (Executive Assistant, Personal Assistant, Admin)
        Route::middleware(['role:executive_assistant|personal_assistant|admin|super_admin'])
            ->prefix('calendar')
            ->name('calendar.')
            ->group(function () {
                Route::get('/', [CalendarController::class, 'index'])->name('index');
                Route::get('/events', [CalendarController::class, 'events'])->name('events');
                Route::post('/events', [CalendarController::class, 'store'])->name('store');
                Route::put('/events/{event}', [CalendarController::class, 'update'])->name('update');
                Route::delete('/events/{event}', [CalendarController::class, 'destroy'])->name('destroy');
            });

        // Visitor Management (All front office roles)
        Route::middleware(['role:executive_assistant|receptionist|personal_assistant|admin|super_admin'])
            ->prefix('visitors')
            ->name('visitors.')
            ->group(function () {
                Route::get('/', [VisitorController::class, 'index'])->name('index');
                Route::post('/', [VisitorController::class, 'store'])->name('store');
                Route::put('/{visitor}/badge', [VisitorController::class, 'badge'])->name('badge');
            });

        // Messages/Communications (All front office roles)
        Route::middleware(['role:executive_assistant|receptionist|personal_assistant|admin|super_admin'])
            ->prefix('messages')
            ->name('messages.')
            ->group(function () {
                Route::get('/', [MessageController::class, 'index'])->name('index');
                Route::post('/', [MessageController::class, 'store'])->name('store');
                Route::put('/{message}/read', [MessageController::class, 'markRead'])->name('read');
            });

        // Reports & Analytics (Executive Assistant only)
        Route::middleware(['role:executive_assistant|admin|super_admin'])
            ->prefix('reports')
            ->name('reports.')
            ->group(function () {
                Route::get('/', [DashboardController::class, 'reports'])->name('index');
                Route::get('/visitors', [DashboardController::class, 'visitorReports'])->name('visitors');
                Route::get('/export', [DashboardController::class, 'export'])->name('export');
            });

        // Task Management (Executive Assistant, Personal Assistant, Admin)
        Route::middleware(['role:executive_assistant|personal_assistant|admin|super_admin'])
            ->prefix('tasks')
            ->name('tasks.')
            ->group(function () {
                Route::get('/', [TaskController::class, 'index'])->name('index');
                Route::post('/', [TaskController::class, 'store'])->name('store');
                Route::put('/{task}/complete', [TaskController::class, 'complete'])->name('complete');
                Route::delete('/{task}', [TaskController::class, 'destroy'])->name('destroy');
                Route::post('/bulk', [TaskController::class, 'bulkUpdate'])->name('bulk');
                Route::post('/{task}/comments', [TaskController::class, 'storeComment'])->name('comments.store');
                Route::post('/{task}/time', [TaskController::class, 'storeTimeEntry'])->name('time.store');
                Route::get('/export', [TaskController::class, 'export'])->name('export');
            });
    });
