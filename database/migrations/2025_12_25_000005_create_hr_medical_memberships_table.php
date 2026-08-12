<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hr_medical_memberships', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('hr_medical_scheme_id');
            $table->unsignedBigInteger('guard_id');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('member_no', 100)->nullable();
            $table->string('status', 30)->default('active');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('hr_medical_scheme_id')->references('id')->on('hr_medical_schemes')->onDelete('cascade');
            $table->foreign('guard_id')->references('id')->on('guards')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_medical_memberships');
    }
};
