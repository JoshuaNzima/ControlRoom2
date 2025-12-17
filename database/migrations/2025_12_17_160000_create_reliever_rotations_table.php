<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reliever_rotations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('guard_id');
            $table->unsignedBigInteger('client_site_id');
            $table->date('date');
            $table->unsignedBigInteger('assigned_by')->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->foreign('guard_id')->references('id')->on('guards')->onDelete('cascade');
            $table->foreign('client_site_id')->references('id')->on('client_sites')->onDelete('cascade');
            $table->foreign('assigned_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['guard_id', 'date']);
            $table->index(['date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reliever_rotations');
    }
};
