<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervisor_incentive_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guard_id')->constrained('guards')->onDelete('cascade');
            $table->decimal('base_amount', 12, 2)->default(0)->comment('Base incentive amount per period');
            $table->decimal('per_guard_amount', 12, 2)->default(0)->comment('Additional amount per guard under supervision');
            $table->decimal('absence_deduction', 12, 2)->default(0)->comment('Amount deducted per absent guard');
            $table->decimal('uncovered_site_deduction', 12, 2)->default(0)->comment('Amount deducted when site left uncovered');
            $table->enum('calculation_period', ['weekly', 'bi_weekly', 'monthly'])->default('monthly');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique('guard_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supervisor_incentive_profiles');
    }
};
