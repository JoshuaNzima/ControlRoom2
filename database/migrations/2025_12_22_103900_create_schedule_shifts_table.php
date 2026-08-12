<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('schedule_shifts')) {
            Schema::create('schedule_shifts', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->time('start_time');
                $table->time('end_time');
                $table->text('description')->nullable();
                $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->integer('required_guards')->nullable();
                $table->json('sites')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('status')->default('active'); // active | inactive | completed
                $table->boolean('is_global')->default(false);
                $table->timestamps();

                $table->index('status');
                $table->index('supervisor_id');
                $table->index('created_by');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_shifts');
    }
};
