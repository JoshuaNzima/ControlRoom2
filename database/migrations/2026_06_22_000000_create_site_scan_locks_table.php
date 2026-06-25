<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_scan_locks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('client_site_id')->constrained('client_sites')->cascadeOnDelete();
            $table->foreignId('checkpoint_id')->nullable()->constrained('checkpoints')->nullOnDelete();
            $table->foreignId('scan_id')->nullable()->constrained('checkpoint_scans')->nullOnDelete();
            $table->timestamp('expires_at');
            $table->timestamps();

            // One active lock per user
            $table->unique('user_id');
            // Index for checking site-level locks
            $table->index('client_site_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_scan_locks');
    }
};
