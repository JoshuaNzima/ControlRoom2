<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nvr_devices', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('client_site_id')->nullable()->constrained('client_sites')->nullOnDelete();
            $table->enum('device_type', ['nvr', 'dvr'])->default('nvr');
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            
            // Connection details (port forwarded)
            $table->string('public_protocol')->nullable();
            $table->string('public_host');
            $table->integer('public_port')->default(80);
            $table->string('public_path')->nullable();
            
            // Local network details
            $table->string('local_ip')->nullable();
            $table->integer('local_port')->nullable();
            
            // Authentication
            $table->string('username')->nullable();
            $table->text('password')->nullable();
            $table->string('api_key')->nullable();
            
            // Status
            $table->enum('status', ['online', 'offline', 'error', 'disabled'])->default('offline');
            $table->timestamp('last_online_at')->nullable();
            $table->timestamp('last_sync_at')->nullable();
            
            // Channel count
            $table->integer('channel_count')->default(0);
            $table->integer('active_channels')->default(0);
            
            // Settings
            $table->json('settings')->nullable();
            $table->text('notes')->nullable();
            
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nvr_devices');
    }
};
