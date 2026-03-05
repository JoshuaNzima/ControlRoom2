<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incentive_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('category')->default('performance'); // performance, referral, attendance, safety, tenure
            $table->string('applies_to')->default('all'); // all, supervisor, guard, driver, staff
            $table->boolean('is_active')->default(true);
            $table->boolean('requires_approval')->default(true);
            $table->json('default_config')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('incentive_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incentive_type_id')->constrained('incentive_types')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('condition_type'); // attendance_threshold, performance_score, referral_count, safety_incident_free, tenure_years
            $table->json('condition_config'); // { "threshold": 95, "metric": "attendance_rate" }
            $table->string('calculation_type'); // fixed, percentage_of_base, per_unit, tiered
            $table->json('calculation_config'); // { "amount": 5000, "currency": "MWK" }
            $table->decimal('min_amount', 12, 2)->nullable();
            $table->decimal('max_amount', 12, 2)->nullable();
            $table->string('period_type')->default('monthly'); // daily, weekly, monthly, quarterly, yearly, one_time
            $table->boolean('is_active')->default(true);
            $table->date('effective_from')->nullable();
            $table->date('effective_until')->nullable();
            $table->timestamps();
        });

        Schema::create('incentive_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('group')->default('general');
            $table->string('label');
            $table->text('description')->nullable();
            $table->string('type'); // number, boolean, string, json, select
            $table->text('value');
            $table->json('options')->nullable(); // for select type
            $table->boolean('is_editable')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('guard_incentive_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guard_id')->constrained('guards')->onDelete('cascade');
            $table->foreignId('incentive_type_id')->constrained('incentive_types')->onDelete('cascade');
            $table->json('custom_config')->nullable();
            $table->boolean('is_active')->default(true);
            $table->date('effective_from')->nullable();
            $table->date('effective_until')->nullable();
            $table->timestamps();

            $table->unique(['guard_id', 'incentive_type_id']);
        });

        Schema::create('incentive_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guard_id')->constrained('guards')->onDelete('cascade');
            $table->foreignId('incentive_type_id')->constrained('incentive_types')->onDelete('cascade');
            $table->foreignId('incentive_rule_id')->nullable()->constrained('incentive_rules')->onDelete('set null');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('base_amount', 12, 2)->default(0);
            $table->decimal('calculated_amount', 12, 2);
            $table->decimal('adjustment_amount', 12, 2)->default(0);
            $table->text('adjustment_reason')->nullable();
            $table->decimal('final_amount', 12, 2);
            $table->string('status')->default('pending'); // pending, approved, rejected, paid
            $table->json('calculation_details')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('calculated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('calculated_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('paid_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['guard_id', 'period_start', 'period_end']);
            $table->index(['status', 'period_end']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incentive_entries');
        Schema::dropIfExists('guard_incentive_profiles');
        Schema::dropIfExists('incentive_settings');
        Schema::dropIfExists('incentive_rules');
        Schema::dropIfExists('incentive_types');
    }
};
