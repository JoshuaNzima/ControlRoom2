<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cameras', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('client_site_id')->constrained('client_sites')->onDelete('cascade');
            $table->string('stream_url');
            $table->enum('type', ['ptz', 'fixed', 'dome', 'thermal']);
            $table->string('location')->nullable();
            $table->enum('status', ['online', 'offline', 'maintenance', 'disabled'])->default('offline');
            $table->timestamp('last_online')->nullable();
            $table->boolean('recording_enabled')->default(true);
            $table->integer('retention_days')->default(30);
            $table->text('credentials')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('camera_recordings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('camera_id')->constrained()->onDelete('cascade');
            $table->timestamp('start_time');
            $table->timestamp('end_time')->nullable();
            $table->string('file_path');
            $table->bigInteger('size')->default(0);
            $table->enum('type', ['continuous', 'motion', 'alert', 'manual']);
            $table->enum('trigger_type', ['scheduled', 'motion', 'alert', 'manual']);
            $table->json('trigger_metadata')->nullable();
            $table->enum('status', ['recording', 'completed', 'failed', 'archived'])->default('recording');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('camera_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('camera_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['motion', 'tampering', 'offline', 'object_detected']);
            $table->string('description');
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->enum('status', ['active', 'acknowledged', 'resolved', 'false_alarm'])->default('active');
            $table->json('metadata')->nullable();
            $table->foreignId('acknowledged_by')->nullable()->constrained('users');
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('camera_alerts');
        Schema::dropIfExists('camera_recordings');
        Schema::dropIfExists('cameras');
    }
};