<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('relief_bundles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('reliever_guard_id');
            $table->unsignedBigInteger('zone_id')->nullable();
            $table->unsignedBigInteger('supervisor_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('reliever_guard_id')->references('id')->on('guards')->onDelete('cascade');
            $table->foreign('zone_id')->references('id')->on('zones')->nullOnDelete();
            $table->foreign('supervisor_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['reliever_guard_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relief_bundles');
    }
};
