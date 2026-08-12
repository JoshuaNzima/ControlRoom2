<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_dispatches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('guards');
            $table->foreignId('origin_site_id')->nullable()->constrained('client_sites');
            $table->foreignId('destination_site_id')->nullable()->constrained('client_sites');
            $table->unsignedInteger('odometer_out')->nullable();
            $table->unsignedInteger('odometer_in')->nullable();
            $table->unsignedTinyInteger('fuel_level_out')->nullable();
            $table->unsignedTinyInteger('fuel_level_in')->nullable();
            $table->enum('status', ['dispatched', 'returned', 'cancelled'])->default('dispatched');
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->text('purpose')->nullable();
            $table->text('notes_out')->nullable();
            $table->text('notes_in')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_dispatches');
    }
};
