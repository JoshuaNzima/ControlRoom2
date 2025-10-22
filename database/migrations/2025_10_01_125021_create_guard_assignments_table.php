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
        Schema::create('guard_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guard_id')->constrained('guards')->onDelete('cascade');
            $table->foreignId('client_site_id')->constrained('client_sites')->onDelete('cascade');
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->enum('assignment_type', ['permanent', 'temporary'])->default('permanent');
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            // index on active flag
            $table->index(['guard_id', 'active']);
            $table->index(['client_site_id', 'active']);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guard_assignments');
    }
};
