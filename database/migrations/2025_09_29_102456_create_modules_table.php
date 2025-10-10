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
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('display_name');
            $table->string('description')->nullable();
            $table->string('icon')->nullable();
            $table->string('color')->default('#6B7280');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_core')->default(false); // Core modules can't be disabled
            $table->json('config')->nullable(); // Module-specific configuration
            $table->integer('sort_order')->default(0);
            $table->string('version')->default('1.0.0');
            $table->timestamps();
        });

         Schema::create('user_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('module_id')->constrained()->onDelete('cascade');
            $table->boolean('has_access')->default(true);
            $table->json('preferences')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'module_id']);
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        schema::dropIfExists('user_modules');
        Schema::dropIfExists('modules');
    }
};
