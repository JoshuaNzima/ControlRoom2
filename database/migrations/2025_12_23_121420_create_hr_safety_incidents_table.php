<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hr_safety_incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guard_id')->nullable()->constrained('guards')->nullOnDelete();
            $table->string('site')->nullable();
            $table->string('type', 100)->index();
            $table->string('severity', 40)->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->string('status', 20)->default('open')->index();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['guard_id','status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_safety_incidents');
    }
};
