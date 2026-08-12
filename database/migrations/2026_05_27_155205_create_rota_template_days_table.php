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
Schema::create('rota_template_days', function (Blueprint $table) {
            $table->id();

            $table->foreignId('rota_template_id')->constrained('rota_templates')->cascadeOnDelete();

            // 0=Sun ... 6=Sat
            $table->unsignedTinyInteger('weekday');

            // For v1: just off/on for each weekday.
            $table->boolean('is_off')->default(false);

            $table->timestamps();

            $table->unique(['rota_template_id', 'weekday']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rota_template_days');
    }
};
