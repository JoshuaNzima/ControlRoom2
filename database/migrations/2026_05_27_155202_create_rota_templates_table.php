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
Schema::create('rota_templates', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->text('notes')->nullable();

            // Optional: allow shift type to be used for time windows in templates later
            $table->string('default_shift_type')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rota_templates');
    }
};
