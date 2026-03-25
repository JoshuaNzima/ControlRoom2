<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            // Add new columns
            $table->string('phone')->nullable()->after('company');
            $table->string('email')->nullable()->after('phone');
            $table->foreignId('host_id')->nullable()->after('purpose')->constrained('users')->nullOnDelete();
            $table->string('host_name')->nullable()->after('host_id');
            $table->text('notes')->nullable()->after('host_name');
            $table->foreignId('registered_by')->nullable()->after('check_out_at')->constrained('users')->nullOnDelete();

            // Rename columns
            $table->renameColumn('contact_person', 'purpose');
            $table->renameColumn('check_in_at', 'check_in');
            $table->renameColumn('check_out_at', 'check_out');

            // Drop old columns
            $table->dropColumn('status');

            // Add indexes
            $table->index('check_in');
            $table->index('host_id');
        });
    }

    public function down(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            $table->dropColumn(['phone', 'email', 'host_id', 'host_name', 'notes', 'registered_by']);
            $table->renameColumn('check_in', 'check_in_at');
            $table->renameColumn('check_out', 'check_out_at');
            $table->enum('status', ['checked_in','checked_out'])->default('checked_in')->after('badge_number');
            $table->dropIndex(['check_in']);
            $table->dropIndex(['host_id']);
        });
    }
};
