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
        Schema::create('assistant_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assistant_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('assigned_to_id')->constrained('users')->onDelete('cascade');
            $table->enum('assignment_type', ['executive', 'personal', 'both'])->default('both');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->timestamps();
            $table->softDeletes();

            // Prevent duplicate assignments
            $table->unique(['assistant_id', 'assigned_to_id'], 'unique_assistant_assignment');
            
            // Index for faster queries
            $table->index(['assistant_id', 'status']);
            $table->index(['assigned_to_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assistant_assignments');
    }
};
