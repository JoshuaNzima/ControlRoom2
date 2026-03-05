<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weekly_roster_plan_entries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('weekly_roster_plan_id');
            $table->unsignedBigInteger('guard_id');
            $table->date('date');

            // Nullable to allow an explicit "no site" plan entry (e.g., unassigned / blank)
            $table->unsignedBigInteger('client_site_id')->nullable();

            $table->enum('entry_type', ['site', 'off'])->default('site');
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->foreign('weekly_roster_plan_id')
                ->references('id')
                ->on('weekly_roster_plans')
                ->onDelete('cascade');

            $table->foreign('guard_id')->references('id')->on('guards')->onDelete('cascade');
            $table->foreign('client_site_id')->references('id')->on('client_sites')->nullOnDelete();

            $table->unique(['weekly_roster_plan_id', 'guard_id', 'date'], 'roster_entries_plan_guard_date_unique');
            $table->index(['guard_id', 'date']);
            $table->index(['date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weekly_roster_plan_entries');
    }
};
