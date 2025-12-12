<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Messages\ConversationController;

Route::middleware(['auth'])
    ->prefix('messages')
    ->name('messages.')
    ->group(function () {
        // Users lookup for starting conversations
        Route::get('/users', [ConversationController::class, 'users'])->name('users.index');

        // Conversations
        Route::prefix('conversations')->name('conversations.')->group(function () {
            Route::get('/', [ConversationController::class, 'index'])->name('index');
            Route::post('/', [ConversationController::class, 'store'])->name('store');
            Route::get('/{conversation}', [ConversationController::class, 'show'])->name('show');
            Route::post('/{conversation}/messages', [ConversationController::class, 'sendMessage'])->name('messages.store');
            Route::post('/{conversation}/read', [ConversationController::class, 'markRead'])->name('read');
        });
    });
