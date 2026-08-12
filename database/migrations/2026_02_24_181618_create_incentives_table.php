<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Monthly incentive profiles - fixed monthly amounts per role
        Schema::create('incentive_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('role'); // supervisor, sergeant
            $table->decimal('base_amount', 12, 2)->default(0);
            $table->decimal('penalty_per_unresolved_down', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Monthly incentive records for each supervisor/sergeant
        Schema::create('incentive_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->year('year');
            $table->unsignedTinyInteger('month'); // 1-12
            $table->decimal('base_amount', 12, 2)->default(0);
            $table->integer('unresolved_down_count')->default(0);
            $table->decimal('total_penalties', 12, 2)->default(0);
            $table->decimal('final_amount', 12, 2)->default(0);
            $table->enum('status', ['pending', 'approved', 'paid', 'rejected'])->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('paid_by')->nullable()->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'year', 'month']);
            $table->index(['status', 'year', 'month']);
        });

        // Track which downs were counted against each incentive record
        // Only downs resolved by zone commanders are excluded
        Schema::create('incentive_down_penalties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incentive_record_id')->constrained('incentive_records')->onDelete('cascade');
            $table->foreignId('down_id')->constrained('downs');
            $table->decimal('penalty_amount', 12, 2)->default(0);
            $table->enum('resolution_type', ['zone_commander', 'control_room', 'other'])->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users');
            $table->timestamp('resolved_at')->nullable();
            $table->boolean('counts_against_incentive')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['incentive_record_id', 'counts_against_incentive'], 'idx_penalties_record_counts');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incentive_down_penalties');
        Schema::dropIfExists('incentive_records');
        Schema::dropIfExists('incentive_profiles');
    }
};
