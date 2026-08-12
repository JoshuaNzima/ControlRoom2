<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('budget_requests', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category')->nullable();
            $table->decimal('amount', 14, 2)->default(0);
            $table->date('needed_by')->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('pending_admin');
            $table->unsignedBigInteger('requested_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->unsignedBigInteger('released_by')->nullable();
            $table->text('notes_admin')->nullable();
            $table->text('notes_release')->nullable();
            $table->timestamps();

            $table->index(['status']);
            $table->index(['requested_by']);
            $table->index(['approved_by']);
            $table->index(['released_by']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_requests');
    }
};
