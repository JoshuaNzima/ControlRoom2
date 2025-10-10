<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('down_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_site_id')->constrained()->onDelete('cascade');
            $table->foreignId('supervisor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('checkpoint_id')->nullable()->constrained('checkpoints')->onDelete('set null');
            $table->text('reason')->nullable();
            $table->string('photo')->nullable();
            $table->timestamps();

            $table->index(['client_site_id', 'created_at']);
            $table->index('supervisor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('down_reports');
    }
};


