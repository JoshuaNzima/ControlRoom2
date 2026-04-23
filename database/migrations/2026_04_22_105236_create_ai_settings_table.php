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
        Schema::create('ai_settings', function (Blueprint $table) {
            $table->id();
            $table->string('provider')->default('openai'); // openai, groq, together, openrouter, anthropic, gemini, mistral
            $table->boolean('enabled')->default(false);
            $table->string('api_key')->nullable();
            $table->string('model')->nullable();
            $table->string('base_url')->nullable();
            $table->integer('max_tokens')->default(1000);
            $table->decimal('temperature', 3, 2)->default(0.70);
            $table->text('description')->nullable();
            $table->json('free_models')->nullable();
            $table->boolean('free_tier')->default(false);
            $table->timestamps();
            
            $table->unique('provider');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_settings');
    }
};
