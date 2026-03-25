<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('front_office_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users');
            $table->foreignId('recipient_id')->constrained('users');
            $table->string('subject');
            $table->text('message');
            $table->string('priority')->default('normal'); // low, normal, high, urgent
            $table->dateTime('read_at')->nullable();
            $table->timestamps();

            $table->index('recipient_id');
            $table->index('sender_id');
            $table->index('read_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('front_office_messages');
    }
};
