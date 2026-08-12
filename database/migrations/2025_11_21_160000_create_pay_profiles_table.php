<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pay_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('payee_type'); // 'guard' | 'user'
            $table->unsignedBigInteger('payee_id');
            $table->decimal('monthly_salary', 12, 2)->default(0);
            $table->decimal('overtime_multiplier', 5, 2)->default(1.5);
            $table->decimal('advance_amount', 12, 2)->default(0);
            $table->json('allowances')->nullable();
            $table->decimal('absence_deduction_per_day', 12, 2)->default(0);
            $table->timestamps();
            $table->unique(['payee_type', 'payee_id']);
            $table->index(['payee_type', 'payee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pay_profiles');
    }
};
