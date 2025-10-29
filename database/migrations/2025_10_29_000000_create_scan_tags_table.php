<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scan_tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checkpoint_scan_id')->constrained('checkpoint_scans')->onDelete('cascade');
            $table->json('tags')->nullable();
            $table->timestamps();

            $table->index('checkpoint_scan_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scan_tags');
    }
};
