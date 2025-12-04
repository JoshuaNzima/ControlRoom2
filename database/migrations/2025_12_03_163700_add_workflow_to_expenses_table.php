<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            if (!Schema::hasColumn('expenses', 'approval_stage')) {
                $table->enum('approval_stage', ['admin_pending','asset_pending','complete','rejected'])->default('admin_pending')->after('status');
            }
            if (!Schema::hasColumn('expenses', 'admin_approved_by')) {
                $table->foreignId('admin_approved_by')->nullable()->constrained('users');
                $table->dateTime('admin_approved_at')->nullable();
            }
            if (!Schema::hasColumn('expenses', 'asset_approved_by')) {
                $table->foreignId('asset_approved_by')->nullable()->constrained('users');
                $table->dateTime('asset_approved_at')->nullable();
            }
            if (!Schema::hasColumn('expenses', 'rejected_by')) {
                $table->foreignId('rejected_by')->nullable()->constrained('users');
                $table->dateTime('rejected_at')->nullable();
                $table->text('rejection_reason')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            if (Schema::hasColumn('expenses', 'approval_stage')) {
                $table->dropColumn('approval_stage');
            }
            if (Schema::hasColumn('expenses', 'admin_approved_by')) {
                $table->dropConstrainedForeignId('admin_approved_by');
                $table->dropColumn('admin_approved_at');
            }
            if (Schema::hasColumn('expenses', 'asset_approved_by')) {
                $table->dropConstrainedForeignId('asset_approved_by');
                $table->dropColumn('asset_approved_at');
            }
            if (Schema::hasColumn('expenses', 'rejected_by')) {
                $table->dropConstrainedForeignId('rejected_by');
                $table->dropColumn('rejected_at');
                $table->dropColumn('rejection_reason');
            }
        });
    }
};
