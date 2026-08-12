<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
Schema::create('guard_rota_exceptions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('guard_id')->constrained('guards')->cascadeOnDelete();

            // Stored as date range so leave/training can span multiple days.
            $table->date('start_date');
            $table->date('end_date')->nullable(); // nullable => single day

            $table->string('exception_type');
            $table->text('notes')->nullable();

            // Optional swap linkage for later expansion.
            $table->foreignId('swap_with_guard_id')->nullable()->constrained('guards')->nullOnDelete();

            $table->timestamps();

            $table->index(['guard_id', 'start_date']);
            $table->index(['guard_id', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guard_rota_exceptions');
    }
};
