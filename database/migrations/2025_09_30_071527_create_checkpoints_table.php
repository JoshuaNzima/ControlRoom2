<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checkpoints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_site_id')->constrained()->onDelete('cascade');
            $table->string('name'); 
            $table->string('code')->unique(); 
            $table->enum('type', ['nfc', 'qr'])->default('qr');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('requires_photo')->default(false);
            $table->integer('scan_radius_meters')->default(50); 
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamps();
            
            $table->index('code');
            $table->index(['client_site_id', 'is_active']);
        });
        
        // Track checkpoint scans
        Schema::create('checkpoint_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checkpoint_id')->constrained()->onDelete('cascade');
            $table->foreignId('supervisor_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('scanned_at');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('device_info')->nullable();
            $table->boolean('location_verified')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('scanned_at');
            $table->index('supervisor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checkpoint_scans');
        Schema::dropIfExists('checkpoints');
    }
};