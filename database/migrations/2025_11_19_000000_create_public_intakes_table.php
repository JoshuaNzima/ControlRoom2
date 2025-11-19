<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('public_intakes', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['ticket', 'down', 'incident']);
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('client_name')->nullable();
            $table->string('client_site')->nullable();
            $table->string('title')->nullable();
            $table->string('category')->nullable();
            $table->string('priority')->nullable();
            $table->text('description');
            $table->json('attachments')->nullable();
            $table->string('status')->default('open');
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public_intakes');
    }
};
