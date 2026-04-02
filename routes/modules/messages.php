<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Messages\ConversationController;
use App\Http\Controllers\Messages\ForumController;
use App\Http\Controllers\Messages\ForumThreadController;
use App\Http\Controllers\Messages\ForumReplyController;
use App\Http\Controllers\Messages\MessageReactionController;
use App\Http\Controllers\Messages\MessageAttachmentController;

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
            Route::post('/{conversation}/typing', [ConversationController::class, 'typing'])->name('typing');
        });

        // Message reactions
        Route::post('/messages/{message}/react', [MessageReactionController::class, 'store'])->name('messages.react');
        Route::delete('/messages/{message}/react', [MessageReactionController::class, 'destroy'])->name('messages.unreact');

        // Message attachments
        Route::post('/messages/{message}/attachments', [MessageAttachmentController::class, 'store'])->name('messages.attachments.store');
        Route::get('/attachments/{attachment}/download', [MessageAttachmentController::class, 'download'])->name('messages.attachments.download');
        Route::delete('/attachments/{attachment}', [MessageAttachmentController::class, 'destroy'])->name('messages.attachments.destroy');

        // Forums
        Route::prefix('forums')->name('forums.')->group(function () {
            Route::get('/', [ForumController::class, 'index'])->name('index');
            Route::post('/', [ForumController::class, 'store'])->name('store');
            Route::get('/{forum}', [ForumController::class, 'show'])->name('show');
            Route::patch('/{forum}', [ForumController::class, 'update'])->name('update');
            Route::post('/{forum}/join', [ForumController::class, 'join'])->name('join');
            Route::post('/{forum}/leave', [ForumController::class, 'leave'])->name('leave');

            // Forum members
            Route::get('/{forum}/members', [ForumController::class, 'members'])->name('members');
            Route::post('/{forum}/members', [ForumController::class, 'addMember'])->name('members.add');
            Route::delete('/{forum}/members/{userId}', [ForumController::class, 'removeMember'])->name('members.remove');

            // Forum threads
            Route::post('/{forum}/threads', [ForumThreadController::class, 'store'])->name('threads.store');
            Route::get('/{forum}/threads/{thread}', [ForumThreadController::class, 'show'])->name('threads.show');
            Route::patch('/{forum}/threads/{thread}', [ForumThreadController::class, 'update'])->name('threads.update');
            Route::delete('/{forum}/threads/{thread}', [ForumThreadController::class, 'destroy'])->name('threads.destroy');

            // Thread moderation
            Route::post('/{forum}/threads/{thread}/pin', [ForumThreadController::class, 'pin'])->name('threads.pin');
            Route::post('/{forum}/threads/{thread}/unpin', [ForumThreadController::class, 'unpin'])->name('threads.unpin');
            Route::post('/{forum}/threads/{thread}/lock', [ForumThreadController::class, 'lock'])->name('threads.lock');
            Route::post('/{forum}/threads/{thread}/unlock', [ForumThreadController::class, 'unlock'])->name('threads.unlock');

            // Thread replies
            Route::post('/{forum}/threads/{thread}/replies', [ForumReplyController::class, 'store'])->name('replies.store');
            Route::patch('/{forum}/threads/{thread}/replies/{reply}', [ForumReplyController::class, 'update'])->name('replies.update');
            Route::delete('/{forum}/threads/{thread}/replies/{reply}', [ForumReplyController::class, 'destroy'])->name('replies.destroy');
            Route::post('/{forum}/threads/{thread}/replies/{reply}/vote', [ForumReplyController::class, 'vote'])->name('replies.vote');
            Route::post('/{forum}/threads/{thread}/replies/{reply}/solution', [ForumReplyController::class, 'markSolution'])->name('replies.solution');
        });
    });
