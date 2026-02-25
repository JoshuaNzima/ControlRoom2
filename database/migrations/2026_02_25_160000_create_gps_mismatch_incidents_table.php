<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gps_mismatch_incidents', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('site_id')->nullable();
            $table->unsignedBigInteger('checkpoint_id')->nullable();

            $table->string('scan_type', 30);

            $table->decimal('attempted_latitude', 10, 8)->nullable();
            $table->decimal('attempted_longitude', 11, 8)->nullable();

            $table->decimal('expected_latitude', 10, 8)->nullable();
            $table->decimal('expected_longitude', 11, 8)->nullable();

            $table->unsignedInteger('distance_meters')->nullable();
            $table->unsignedInteger('radius_meters')->nullable();

            $table->unsignedInteger('mismatch_count')->default(1);
            $table->unsignedInteger('threshold')->default(3);
            $table->unsignedInteger('window_minutes')->default(10);
            $table->boolean('escalated')->default(false);

            $table->text('message')->nullable();
            $table->timestamp('occurred_at')->useCurrent();

            $table->timestamps();

            $table->index(['site_id', 'occurred_at']);
            $table->index(['user_id', 'occurred_at']);
            $table->index(['escalated', 'occurred_at']);

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('site_id')->references('id')->on('client_sites')->nullOnDelete();
            $table->foreign('checkpoint_id')->references('id')->on('checkpoints')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gps_mismatch_incidents');
    }
};
