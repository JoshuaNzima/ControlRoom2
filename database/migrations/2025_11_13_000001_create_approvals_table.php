<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('expense_id')->constrained('expenses')->onDelete('cascade');
            $table->foreignId('approver_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->integer('stage')->default(1)->comment('Order of approval stage');
            $table->text('comments')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['approver_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};
