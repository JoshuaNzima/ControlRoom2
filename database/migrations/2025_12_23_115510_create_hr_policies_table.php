<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hr_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hr_policy_category_id')->nullable()->constrained('hr_policy_categories')->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('version')->nullable();
            $table->date('effective_date')->nullable();
            $table->boolean('published')->default(false)->index();
            $table->text('summary')->nullable();
            $table->longText('content')->nullable();
            $table->timestamps();
            $table->index(['hr_policy_category_id']);
            $table->index(['effective_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_policies');
    }
};
