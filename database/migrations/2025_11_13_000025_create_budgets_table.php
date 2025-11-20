<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category'); // reference to expense categories
            $table->decimal('budgeted_amount', 12, 2);
            $table->integer('fiscal_year')->comment('Budget year');
            $table->integer('fiscal_month')->nullable()->comment('NULL = annual budget, 1-12 for monthly');
            $table->foreignId('user_id')->constrained();
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active');
            $table->timestamps();
            $table->index('fiscal_year');
            $table->index('category');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
