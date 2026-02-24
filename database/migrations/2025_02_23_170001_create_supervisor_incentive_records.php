<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervisor_incentive_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guard_id')->constrained('guards')->onDelete('cascade');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('base_amount', 12, 2)->default(0);
            $table->decimal('performance_bonus', 12, 2)->default(0)->comment('Bonus based on good performance');
            $table->integer('guards_count')->default(0)->comment('Number of guards supervised');
            $table->decimal('per_guard_total', 12, 2)->default(0);
            $table->integer('absences_count')->default(0)->comment('Number of guard absences');
            $table->decimal('absence_deductions', 12, 2)->default(0);
            $table->integer('uncovered_sites_count')->default(0);
            $table->decimal('uncovered_site_deductions', 12, 2)->default(0);
            $table->decimal('total_deductions', 12, 2)->default(0);
            $table->decimal('net_amount', 12, 2)->default(0);
            $table->enum('status', ['pending', 'approved', 'paid', 'rejected'])->default('pending');
            $table->text('notes')->nullable();
            $table->foreignId('calculated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('calculated_at')->useCurrent();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->index(['guard_id', 'period_start', 'period_end'], 'incentive_records_guard_period_idx');
            $table->index(['status', 'period_end'], 'incentive_records_status_period_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supervisor_incentive_records');
    }
};
