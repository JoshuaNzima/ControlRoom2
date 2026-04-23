<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chat_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('session_id')->unique();
            $table->string('status')->default('active'); // active, transferred, resolved, closed
            $table->string('context')->default('general');
            $table->json('metadata')->nullable();
            $table->unsignedBigInteger('transferred_to')->nullable(); // Admin/support user
            $table->timestamp('transferred_at')->nullable();
            $table->timestamps();

            $table->foreign('transferred_to')->references('id')->on('users')->onDelete('set null');
            $table->index(['status', 'transferred_to']);
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_session_id')->constrained()->onDelete('cascade');
            $table->string('sender_type'); // user, assistant, agent
            $table->unsignedBigInteger('sender_id')->nullable();
            $table->text('message');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['chat_session_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_sessions');
    }
};
