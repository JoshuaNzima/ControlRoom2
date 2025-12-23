<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guard_checklist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guard_checklist_id')->constrained('guard_checklists')->cascadeOnDelete();
            $table->foreignId('checklist_template_item_id')->nullable()->constrained('checklist_template_items')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('due_date')->nullable();
            $table->string('status')->default('pending'); // pending|done|skipped
            $table->dateTime('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['guard_checklist_id','status']);
            $table->index(['due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guard_checklist_items');
    }
};
