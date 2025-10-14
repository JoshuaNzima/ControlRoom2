<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('alerts')) {
            Schema::create('alerts', function (Blueprint $table) {
                $table->id();
                $table->string('title')->nullable();
                $table->text('message')->nullable();
                $table->string('type')->nullable();
                $table->string('priority')->nullable();
                $table->string('status')->default('active');
                $table->string('source_type')->nullable();
                $table->unsignedBigInteger('source_id')->nullable();
                $table->json('target_groups')->nullable();
                $table->foreignId('acknowledged_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('acknowledged_at')->nullable();
                $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('resolved_at')->nullable();
                $table->json('meta')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('alerts')) {
            Schema::dropIfExists('alerts');
        }
    }
};
