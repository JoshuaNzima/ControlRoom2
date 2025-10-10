<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('guard_infractions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guard_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // e.g., 'late', 'absent', 'misconduct'
            $table->text('description');
            $table->string('severity')->default('minor'); // minor, moderate, major
            $table->timestamp('incident_date');
            $table->string('status')->default('pending'); // pending, reviewed, resolved
            $table->text('resolution')->nullable();
            $table->foreignId('reported_by')->constrained('users');
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Add infraction_count to guards table
        Schema::table('guards', function (Blueprint $table) {
            $table->integer('infraction_count')->default(0);
            $table->string('risk_level')->default('normal'); // normal, warning, high
            $table->timestamp('last_infraction_at')->nullable();
        });
    }

    public function down()
    {
        Schema::table('guards', function (Blueprint $table) {
            $table->dropColumn(['infraction_count', 'risk_level', 'last_infraction_at']);
        });

        Schema::dropIfExists('guard_infractions');
    }
};