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
        Schema::create('dashboard_tutorials', function (Blueprint $table) {
            $table->id();
            $table->string('dashboard'); // admin, superadmin, control-room, assets, client
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('content_type', ['video', 'document', 'text'])->default('text');
            $table->text('content')->nullable(); // For text content or embed URL
            $table->string('file_path')->nullable(); // For uploaded documents/videos
            $table->string('video_url')->nullable(); // For YouTube/Vimeo embeds
            $table->integer('order')->default(0); // Display order
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            
            $table->index(['dashboard', 'is_active', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dashboard_tutorials');
    }
};
