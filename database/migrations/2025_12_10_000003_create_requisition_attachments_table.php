<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('requisition_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('requisition_id');
            $table->unsignedBigInteger('uploaded_by');
            $table->string('disk')->default('local');
            $table->string('path');
            $table->string('original_name');
            $table->bigInteger('size')->default(0);
            $table->string('mime_type')->nullable();
            $table->timestamps();

            $table->foreign('requisition_id')->references('id')->on('requisitions')->cascadeOnDelete();
            $table->foreign('uploaded_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requisition_attachments');
    }
};
