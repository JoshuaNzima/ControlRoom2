<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('client_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('client_id');
            $table->string('title');
            $table->date('event_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('location')->nullable();
            $table->string('category')->default('event_security');
            $table->string('billing_type')->default('per_event');
            $table->decimal('rate', 12, 2)->default(0);
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('expected_amount', 12, 2)->default(0);
            $table->string('status')->default('planned');
            $table->unsignedInteger('k9_units')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['event_date', 'status']);
            $table->index(['category']);
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_events');
    }
};
