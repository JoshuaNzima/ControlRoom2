<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Loyalty points configuration
        Schema::create('loyalty_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['payment', 'service', 'referral', 'contract_length'])->unique();
            $table->decimal('points_per_unit', 8, 2);
            $table->string('unit_description'); // e.g., "per MWK 1000"
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0);
            $table->json('conditions')->nullable(); // JSON rules for applying points
            $table->timestamps();
        });

        // Client loyalty points balance
        Schema::create('client_loyalty_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->decimal('total_points', 12, 2)->default(0);
            $table->decimal('available_points', 12, 2)->default(0);
            $table->decimal('redeemed_points', 12, 2)->default(0);
            $table->decimal('pending_points', 12, 2)->default(0); // Awaiting approval
            $table->timestamp('last_earned_at')->nullable();
            $table->timestamp('last_redeemed_at')->nullable();
            $table->json('tier_metadata')->nullable(); // Current tier info
            $table->timestamps();
            $table->unique('client_id');
        });

        // Transaction history for audit and analytics
        Schema::create('client_loyalty_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_loyalty_points_id')->constrained('client_loyalty_points')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->enum('type', ['earned', 'redeemed', 'expired', 'adjusted', 'bonus'])->index();
            $table->decimal('points', 12, 2);
            $table->decimal('balance_before', 12, 2);
            $table->decimal('balance_after', 12, 2);
            $table->string('reason')->nullable(); // e.g., "Payment for invoice #123"
            $table->foreignId('related_id')->nullable(); // ID of related entity (payment, service, etc)
            $table->string('related_type')->nullable(); // Type of related entity
            $table->nullableMorphs('causable'); // Polymorphic relation for who/what caused it
            $table->json('metadata')->nullable();
            $table->enum('status', ['pending', 'completed', 'reversed'])->default('completed');
            $table->timestamps();
            $table->index(['client_id', 'created_at']);
            $table->index(['type', 'status']);
        });

        // Loyalty tiers configuration
        Schema::create('loyalty_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('level');
            $table->decimal('min_points', 12, 2);
            $table->decimal('max_points', 12, 2)->nullable();
            $table->decimal('multiplier', 4, 2)->default(1.0); // Points earning multiplier
            $table->json('benefits')->nullable(); // JSON array of benefits
            $table->string('color')->default('#CCCCCC');
            $table->string('icon')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique('level');
        });

        // Redemption options/rewards catalog
        Schema::create('loyalty_rewards', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['discount', 'service', 'credit', 'voucher', 'custom'])->index();
            $table->decimal('points_required', 12, 2);
            $table->decimal('value', 12, 2)->nullable(); // MWK value or percentage
            $table->string('unit')->nullable(); // MWK, %, services, days
            $table->integer('quantity_available')->nullable();
            $table->integer('quantity_redeemed')->default(0);
            $table->boolean('is_limited')->default(false);
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->json('terms')->nullable();
            $table->boolean('requires_approval')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Redemption requests
        Schema::create('client_loyalty_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('loyalty_reward_id')->constrained('loyalty_rewards')->restrictOnDelete();
            $table->foreignId('client_loyalty_transaction_id')->nullable()->constrained('client_loyalty_transactions')->nullOnDelete();
            $table->decimal('points_used', 12, 2);
            $table->decimal('value_received', 12, 2)->nullable();
            $table->enum('status', ['pending', 'approved', 'completed', 'rejected', 'cancelled'])->default('pending')->index();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('redeemed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['client_id', 'status']);
            $table->index(['status', 'created_at']);
        });

        // Expiry tracking
        Schema::create('client_loyalty_expirations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->decimal('points', 12, 2);
            $table->timestamp('expires_at');
            $table->boolean('processed')->default(false);
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->index(['expires_at', 'processed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_loyalty_expirations');
        Schema::dropIfExists('client_loyalty_redemptions');
        Schema::dropIfExists('loyalty_rewards');
        Schema::dropIfExists('loyalty_tiers');
        Schema::dropIfExists('client_loyalty_transactions');
        Schema::dropIfExists('client_loyalty_points');
        Schema::dropIfExists('loyalty_rules');
    }
};
