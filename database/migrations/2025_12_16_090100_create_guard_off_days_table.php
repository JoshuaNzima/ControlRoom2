<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guard_off_days', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('guard_id');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->foreign('guard_id')->references('id')->on('guards')->onDelete('cascade');
            $table->index(['guard_id', 'start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guard_off_days');
    }
};
