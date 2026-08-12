<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('public_intakes')) return;

        Schema::table('public_intakes', function (Blueprint $table) {
            if (!Schema::hasColumn('public_intakes', 'converted_type')) {
                $table->enum('converted_type', ['ticket', 'down', 'incident'])->nullable()->after('user_agent');
            }
            if (!Schema::hasColumn('public_intakes', 'converted_id')) {
                $table->unsignedBigInteger('converted_id')->nullable()->after('converted_type');
            }
            if (!Schema::hasColumn('public_intakes', 'converted_by')) {
                $table->foreignId('converted_by')->nullable()->constrained('users')->after('converted_id');
            }
            if (!Schema::hasColumn('public_intakes', 'converted_at')) {
                $table->timestamp('converted_at')->nullable()->after('converted_by');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('public_intakes')) return;

        Schema::table('public_intakes', function (Blueprint $table) {
            if (Schema::hasColumn('public_intakes', 'converted_at')) {
                $table->dropColumn('converted_at');
            }
            if (Schema::hasColumn('public_intakes', 'converted_by')) {
                $table->dropConstrainedForeignId('converted_by');
            }
            if (Schema::hasColumn('public_intakes', 'converted_id')) {
                $table->dropColumn('converted_id');
            }
            if (Schema::hasColumn('public_intakes', 'converted_type')) {
                $table->dropColumn('converted_type');
            }
        });
    }
};
