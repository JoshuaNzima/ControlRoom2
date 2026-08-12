<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flags', function (Blueprint $table) {
            // Add new categorization fields
            $table->string('category')->after('status')->default('misconduct');  // misconduct, performance, attendance, safety, other
            $table->string('priority')->after('category')->default('medium');    // low, medium, high, critical
            $table->string('location')->after('priority')->nullable();          // Where the incident occurred
            $table->dateTime('incident_date')->after('location')->nullable();   // When the incident occurred
            $table->json('witnesses')->after('incident_date')->nullable();      // Array of witness IDs or names
            $table->string('evidence_type')->after('witnesses')->nullable();    // photo, video, document, none
            $table->string('evidence_path')->after('evidence_type')->nullable(); // Path to evidence file
            
            // Related entities
            $table->foreignId('site_id')->after('evidence_path')->nullable()->constrained('client_sites')->nullOnDelete();
            $table->foreignId('shift_id')->after('site_id')->nullable()->constrained('shifts')->nullOnDelete();
            $table->foreignId('supervisor_id')->after('shift_id')->nullable()->constrained('users')->nullOnDelete();

            // Tracking fields
            $table->string('resolution_type')->after('supervisor_id')->nullable();    // warning, suspension, termination, etc.
            $table->text('action_taken')->after('resolution_type')->nullable();       // What action was taken
            $table->integer('repeat_occurrence')->after('action_taken')->default(0);  // How many times this has happened
            $table->dateTime('last_occurred_at')->after('repeat_occurrence')->nullable(); // Last time a similar incident occurred
        });
    }

    public function down(): void
    {
        Schema::table('flags', function (Blueprint $table) {
            $table->dropForeign(['site_id']);
            $table->dropForeign(['shift_id']);
            $table->dropForeign(['supervisor_id']);
            
            $table->dropColumn([
                'category',
                'priority',
                'location',
                'incident_date',
                'witnesses',
                'evidence_type',
                'evidence_path',
                'site_id',
                'shift_id',
                'supervisor_id',
                'resolution_type',
                'action_taken',
                'repeat_occurrence',
                'last_occurred_at'
            ]);
        });
    }
};