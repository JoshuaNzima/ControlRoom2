<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Forums/Channels table
        Schema::create('forums', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('type', ['public', 'private', 'announcement'])->default('public');
            $table->enum('category', ['general', 'department', 'project', 'emergency', 'social'])->default('general');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('color', 7)->default('#dc2626'); // Default red theme
            $table->string('icon')->nullable();
            $table->boolean('is_archived')->default(false);
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Forum members/subscribers
        Schema::create('forum_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('forum_id')->constrained('forums')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['admin', 'moderator', 'member'])->default('member');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('last_read_at')->nullable();
            $table->boolean('notifications_enabled')->default(true);
            $table->timestamps();

            $table->unique(['forum_id', 'user_id']);
        });

        // Forum threads (topics within a forum)
        Schema::create('forum_threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('forum_id')->constrained('forums')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('content');
            $table->enum('type', ['discussion', 'announcement', 'question', 'poll'])->default('discussion');
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_locked')->default(false);
            $table->integer('views_count')->default(0);
            $table->integer('replies_count')->default(0);
            $table->timestamp('last_reply_at')->nullable();
            $table->foreignId('last_reply_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        // Forum thread replies
        Schema::create('forum_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thread_id')->constrained('forum_threads')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('parent_id')->nullable()->constrained('forum_replies')->onDelete('cascade');
            $table->text('content');
            $table->integer('upvotes_count')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        // Thread reply votes
        Schema::create('forum_reply_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reply_id')->constrained('forum_replies')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['upvote', 'downvote']);
            $table->timestamps();

            $table->unique(['reply_id', 'user_id']);
        });

        // Message reactions (for chat)
        Schema::create('message_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('messages')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('reaction', 50); // emoji or reaction type
            $table->timestamps();

            $table->unique(['message_id', 'user_id', 'reaction']);
        });

        // Message attachments
        Schema::create('message_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('messages')->onDelete('cascade');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type', 50);
            $table->bigInteger('file_size');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_attachments');
        Schema::dropIfExists('message_reactions');
        Schema::dropIfExists('forum_reply_votes');
        Schema::dropIfExists('forum_replies');
        Schema::dropIfExists('forum_threads');
        Schema::dropIfExists('forum_members');
        Schema::dropIfExists('forums');
    }
};
