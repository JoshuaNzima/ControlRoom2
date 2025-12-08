<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_handovers', function (Blueprint $table) {
            $table->id();
            $table->string('asset_type'); // 'equipment' or 'vehicle'
            $table->unsignedBigInteger('asset_id');
            $table->unsignedBigInteger('handed_over_by');
            $table->unsignedBigInteger('handed_to');
            $table->string('condition_out')->nullable();
            $table->string('serial')->nullable();
            $table->string('color')->nullable();
            $table->text('notes_out')->nullable();
            $table->string('condition_in')->nullable();
            $table->text('notes_in')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->timestamps();

            $table->index(['asset_type', 'asset_id']);
            $table->index('returned_at');
            $table->foreign('handed_over_by')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('handed_to')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_handovers');
    }
};
