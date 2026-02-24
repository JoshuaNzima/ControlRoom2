<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Training\DashboardController;
use App\Http\Controllers\Training\TraineeController;
use App\Http\Controllers\Training\RegimenController;
use App\Http\Controllers\Training\AttendanceController;
use App\Http\Controllers\Training\CrashCourseController;
use App\Http\Controllers\Training\RefresherController;
use App\Http\Controllers\Training\TrainerGuardsController;
use App\Http\Controllers\Guards\DirectoryController;

Route::middleware(['auth'])->prefix('training')->name('training.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])
        ->middleware('permission:training.dashboard.view')
        ->name('dashboard');

    // Trainees
    Route::prefix('trainees')->name('trainees.')->group(function () {
        Route::get('/', [TraineeController::class, 'index'])
            ->middleware('permission:training.trainees.view')
            ->name('index');

        Route::post('/', [TraineeController::class, 'store'])
            ->middleware('permission:training.trainees.manage')
            ->name('store');

        Route::get('/{trainee}/json', [TraineeController::class, 'showJson'])
            ->middleware('permission:training.trainees.view')
            ->name('json');

        Route::post('/{trainee}/trainers', [TraineeController::class, 'updateTrainers'])
            ->middleware('permission:training.trainees.manage')
            ->name('trainers.update');

        Route::post('/{trainee}/start', [TraineeController::class, 'startTraining'])
            ->middleware('permission:training.trainees.manage')
            ->name('start');

        Route::post('/{trainee}/approve', [TraineeController::class, 'approve'])
            ->middleware('permission:training.trainees.decide')
            ->name('approve');

        Route::post('/{trainee}/reject', [TraineeController::class, 'reject'])
            ->middleware('permission:training.trainees.decide')
            ->name('reject');
    });

    // Regimens
    Route::prefix('regimens')->name('regimens.')->group(function () {
        Route::get('/', [RegimenController::class, 'index'])
            ->middleware('permission:training.regimens.view')
            ->name('index');

        Route::post('/', [RegimenController::class, 'store'])
            ->middleware('permission:training.regimens.manage')
            ->name('store');

        Route::put('/{regimen}', [RegimenController::class, 'update'])
            ->middleware('permission:training.regimens.manage')
            ->name('update');

        Route::delete('/{regimen}', [RegimenController::class, 'destroy'])
            ->middleware('permission:training.regimens.manage')
            ->name('destroy');

        // Goals
        Route::post('/{regimen}/goals', [RegimenController::class, 'storeGoal'])
            ->middleware('permission:training.regimens.manage')
            ->name('goals.store');

        Route::put('/goals/{goal}', [RegimenController::class, 'updateGoal'])
            ->middleware('permission:training.regimens.manage')
            ->name('goals.update');

        Route::delete('/goals/{goal}', [RegimenController::class, 'destroyGoal'])
            ->middleware('permission:training.regimens.manage')
            ->name('goals.destroy');
    });

    // Attendance
    Route::prefix('attendance')->name('attendance.')->group(function () {
        Route::get('/', [AttendanceController::class, 'index'])
            ->middleware('permission:training.trainees.view')
            ->name('index');

        Route::post('/', [AttendanceController::class, 'store'])
            ->middleware('permission:training.trainees.manage')
            ->name('store');

        Route::post('/bulk', [AttendanceController::class, 'bulkStore'])
            ->middleware('permission:training.trainees.manage')
            ->name('store.bulk');

        Route::get('/report', [AttendanceController::class, 'report'])
            ->middleware('permission:training.trainees.view')
            ->name('report');

        Route::get('/{trainee}/history', [AttendanceController::class, 'traineeHistory'])
            ->middleware('permission:training.trainees.view')
            ->name('history');
    });

    // Crash Courses
    Route::prefix('crash-courses')->name('crash-courses.')->group(function () {
        Route::get('/', [CrashCourseController::class, 'index'])
            ->middleware('permission:training.regimens.view')
            ->name('index');

        Route::post('/', [CrashCourseController::class, 'store'])
            ->middleware('permission:training.regimens.manage')
            ->name('store');

        Route::get('/{crashCourse}', [CrashCourseController::class, 'show'])
            ->middleware('permission:training.regimens.view')
            ->name('show');

        Route::put('/{crashCourse}', [CrashCourseController::class, 'update'])
            ->middleware('permission:training.regimens.manage')
            ->name('update');

        Route::delete('/{crashCourse}', [CrashCourseController::class, 'destroy'])
            ->middleware('permission:training.regimens.manage')
            ->name('destroy');

        Route::post('/{crashCourse}/enroll', [CrashCourseController::class, 'enroll'])
            ->middleware('permission:training.regimens.manage')
            ->name('enroll');

        Route::put('/{crashCourse}/enrollments/{trainee}', [CrashCourseController::class, 'updateEnrollment'])
            ->middleware('permission:training.regimens.manage')
            ->name('enrollment.update');

        Route::delete('/{crashCourse}/enrollments/{trainee}', [CrashCourseController::class, 'removeEnrollment'])
            ->middleware('permission:training.regimens.manage')
            ->name('enrollment.destroy');

        Route::post('/{crashCourse}/enrollments/{trainee}/approve', [CrashCourseController::class, 'approveEnrollment'])
            ->middleware('permission:training.regimens.manage')
            ->name('approve');

        Route::post('/{crashCourse}/enrollments/{trainee}/reject', [CrashCourseController::class, 'rejectEnrollment'])
            ->middleware('permission:training.regimens.manage')
            ->name('reject');
    });

    // Refreshers
    Route::prefix('refreshers')->name('refreshers.')->group(function () {
        Route::get('/', [RefresherController::class, 'index'])
            ->middleware('permission:training.regimens.view')
            ->name('index');

        Route::post('/', [RefresherController::class, 'store'])
            ->middleware('permission:training.regimens.manage')
            ->name('store');

        Route::get('/{refresher}', [RefresherController::class, 'show'])
            ->middleware('permission:training.regimens.view')
            ->name('show');

        Route::put('/{refresher}', [RefresherController::class, 'update'])
            ->middleware('permission:training.regimens.manage')
            ->name('update');

        Route::delete('/{refresher}', [RefresherController::class, 'destroy'])
            ->middleware('permission:training.regimens.manage')
            ->name('destroy');

        Route::post('/{refresher}/complete', [RefresherController::class, 'recordCompletion'])
            ->middleware('permission:training.regimens.manage')
            ->name('complete');

        Route::put('/{refresher}/completions/{trainee}', [RefresherController::class, 'updateCompletion'])
            ->middleware('permission:training.regimens.manage')
            ->name('completion.update');

        Route::delete('/{refresher}/completions/{trainee}', [RefresherController::class, 'removeCompletion'])
            ->middleware('permission:training.regimens.manage')
            ->name('completion.destroy');

        Route::get('/expiring/report', [RefresherController::class, 'expiringReport'])
            ->middleware('permission:training.regimens.view')
            ->name('expiring');
    });

    // Trainers can view guards directory
    Route::get('/guards', [DirectoryController::class, 'index'])
        ->middleware('permission:guards.view')
        ->name('guards.index');

    Route::get('/guards/{guard}/json', [DirectoryController::class, 'showJson'])
        ->middleware('permission:guards.view')
        ->name('guards.json');

    // Trainers can create guard records
    Route::post('/guards', [\App\Http\Controllers\Admin\GuardController::class, 'store'])
        ->middleware('permission:guards.create')
        ->name('guards.store');

    // Trainer Guards Management (for refresher training)
    Route::prefix('trainer-guards')->name('trainer-guards.')->group(function () {
        Route::get('/', [TrainerGuardsController::class, 'index'])
            ->middleware('permission:training.regimens.view')
            ->name('index');

        Route::get('/guards/{guard}/details', [TrainerGuardsController::class, 'getGuardDetails'])
            ->middleware('permission:training.regimens.view')
            ->name('details');

        Route::post('/add-to-refresher', [TrainerGuardsController::class, 'addToRefresher'])
            ->middleware('permission:training.regimens.manage')
            ->name('add-to-refresher');

        Route::post('/records/{record}/evaluate', [TrainerGuardsController::class, 'evaluateRefresher'])
            ->middleware('permission:training.regimens.manage')
            ->name('evaluate');

        Route::post('/records/{record}/complete', [TrainerGuardsController::class, 'completeTraining'])
            ->middleware('permission:training.regimens.manage')
            ->name('complete');

        Route::get('/guards/{guard}/history', [TrainerGuardsController::class, 'getGuardRefresherHistory'])
            ->middleware('permission:training.regimens.view')
            ->name('history');

        Route::get('/guards/{guard}', [TrainerGuardsController::class, 'show'])
            ->middleware('permission:training.regimens.view')
            ->name('show');
    });
});
