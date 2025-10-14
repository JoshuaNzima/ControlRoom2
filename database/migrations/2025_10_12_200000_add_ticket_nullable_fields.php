<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete()->after('id');
            $table->foreignId('client_site_id')->nullable()->constrained('client_sites')->nullOnDelete()->after('client_id');
            $table->timestamp('closed_at')->nullable()->after('status');
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete()->after('closed_at');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropColumn('client_id');

            $table->dropForeign(['client_site_id']);
            $table->dropColumn('client_site_id');

            $table->dropColumn('closed_at');

            $table->dropForeign(['closed_by']);
            $table->dropColumn('closed_by');
        });
    }
};
