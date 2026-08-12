<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('downs')) {
            return;
        }

        Schema::table('downs', function (Blueprint $table) {
            // Track which supervisor/sergeant is responsible for this down
            $table->foreignId('supervisor_id')->nullable()->constrained('guards')->after('guard_id')
                ->comment('The supervisor/sergeant responsible for this down');
            
            // Resolution tracking for incentive calculations
            $table->enum('resolution_type', ['self_resolved', 'control_room_resolved', 'escalated', 'unresolved'])
                ->nullable()->after('resolved_at');
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('users')->after('resolution_type')
                ->comment('User who actually resolved the issue');
            
            // Incentive deduction tracking
            $table->boolean('affects_incentive')->default(true)->after('resolved_by_user_id');
            $table->decimal('incentive_deduction_amount', 10, 2)->nullable()->after('affects_incentive');
            $table->timestamp('incentive_deducted_at')->nullable()->after('incentive_deduction_amount');
            
            $table->index(['supervisor_id', 'status', 'affects_incentive']);
            $table->index(['resolution_type', 'affects_incentive']);
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('downs')) {
            return;
        }

        Schema::table('downs', function (Blueprint $table) {
            $table->dropForeign(['supervisor_id']);
            $table->dropForeign(['resolved_by_user_id']);
            $table->dropColumn([
                'supervisor_id',
                'resolution_type',
                'resolved_by_user_id',
                'affects_incentive',
                'incentive_deduction_amount',
                'incentive_deducted_at',
            ]);
        });
    }
};
