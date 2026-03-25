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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('assigned_to')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('module', 50); // control_room, hr, assets, requisitions, invoices, etc.
            $table->string('status', 20)->default('pending'); // pending, in_progress, completed, cancelled
            $table->string('priority', 10)->default('medium'); // low, medium, high, urgent
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('completion_notes')->nullable();
            $table->json('metadata')->nullable(); // for additional module-specific data
            $table->timestamps();

            $table->index(['assigned_to', 'status']);
            $table->index(['module', 'status']);
            $table->index('due_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
