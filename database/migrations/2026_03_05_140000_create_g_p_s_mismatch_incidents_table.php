<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('g_p_s_mismatch_incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guard_id')->nullable()->constrained('guards')->onDelete('set null');
            $table->foreignId('checkpoint_id')->nullable()->constrained('checkpoints')->onDelete('set null');
            $table->foreignId('patrol_id')->nullable()->constrained('patrols')->onDelete('set null');
            $table->foreignId('tag_id')->nullable()->constrained('tags')->onDelete('set null');
            $table->decimal('expected_lat', 10, 8)->nullable();
            $table->decimal('expected_lng', 11, 8)->nullable();
            $table->decimal('actual_lat', 10, 8)->nullable();
            $table->decimal('actual_lng', 11, 8)->nullable();
            $table->decimal('distance_meters', 10, 2)->nullable();
            $table->string('mismatch_type')->default('location'); // location, timing, sequence
            $table->text('notes')->nullable();
            $table->string('status')->default('open'); // open, resolved, ignored
            $table->timestamp('scanned_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['guard_id', 'status']);
            $table->index(['checkpoint_id', 'status']);
            $table->index(['scanned_at']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('g_p_s_mismatch_incidents');
    }
};
