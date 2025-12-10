<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('requisition_batches', function (Blueprint $table) {
            $table->id();
            $table->date('batch_date')->index();
            $table->unsignedBigInteger('compiled_by');
            $table->string('status')->default('pending_ack'); // pending_ack | acknowledged
            $table->unsignedBigInteger('acknowledged_by')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->decimal('total_amount', 14, 2)->default(0);
            $table->timestamps();

            $table->foreign('compiled_by')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('acknowledged_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requisition_batches');
    }
};
