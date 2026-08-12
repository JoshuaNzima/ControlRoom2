<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hr_policy_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hr_policy_id')->constrained('hr_policies')->cascadeOnDelete();
            $table->string('filename');
            $table->string('path');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamps();
            $table->index(['hr_policy_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_policy_files');
    }
};
