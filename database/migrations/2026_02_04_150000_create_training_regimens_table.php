<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_regimens', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->enum('track', ['standard', 'rapid_response'])->default('standard');
            $table->unsignedInteger('default_days')->default(10);
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['track', 'title']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_regimens');
    }
};
