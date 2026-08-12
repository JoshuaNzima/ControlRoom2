<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Update existing commissions table
        Schema::table('commissions', function (Blueprint $table) {
            // Rename amount to total_amount if it exists
            if (Schema::hasColumn('commissions', 'amount')) {
                // We'll keep amount and add total_amount as alias or migrate
                $table->decimal('total_amount', 12, 2)->default(0)->after('amount');
            }

            // Add source field
            if (!Schema::hasColumn('commissions', 'source')) {
                $table->string('source')->default('client_acquisition')->after('total_amount');
            }

            // Update status enum
            if (Schema::hasColumn('commissions', 'status')) {
                $table->string('status')->default('pending')->change();
            }

            // Add description
            if (!Schema::hasColumn('commissions', 'description')) {
                $table->text('description')->nullable()->after('source');
            }

            // Add approved_at, paid_at timestamps
            if (!Schema::hasColumn('commissions', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('commissions', 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('approved_at');
            }

            // Add paid_by
            if (!Schema::hasColumn('commissions', 'paid_by')) {
                $table->foreignId('paid_by')->nullable()->constrained('users')->after('paid_at');
            }

            // Add notes if not exists
            if (!Schema::hasColumn('commissions', 'notes')) {
                $table->text('notes')->nullable();
            }

            // Add indexes
            $table->index(['client_id', 'status']);
            $table->index(['status', 'created_at']);
        });

        // Create commission_splits table
        Schema::create('commission_splits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commission_id')->constrained('commissions')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->decimal('percentage', 5, 2)->default(100);
            $table->decimal('amount', 12, 2)->default(0);
            $table->enum('role', ['primary', 'split'])->default('primary');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['commission_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_splits');

        Schema::table('commissions', function (Blueprint $table) {
            $table->dropColumnIfExists('total_amount');
            $table->dropColumnIfExists('source');
            $table->dropColumnIfExists('description');
            $table->dropColumnIfExists('approved_at');
            $table->dropColumnIfExists('paid_at');
            $table->dropColumnIfExists('paid_by');
        });
    }
};
