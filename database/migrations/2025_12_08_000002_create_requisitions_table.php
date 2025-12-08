<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requisitions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('requested_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->unsignedBigInteger('disbursed_by')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('pending_admin');
            $table->date('needed_by')->nullable();
            $table->text('notes_admin')->nullable();
            $table->text('notes_disbursement')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('requested_by');
            $table->foreign('requested_by')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('disbursed_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requisitions');
    }
};
