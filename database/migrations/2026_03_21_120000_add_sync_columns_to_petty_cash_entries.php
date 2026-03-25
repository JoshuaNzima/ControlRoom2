<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('petty_cash_entries', function (Blueprint $table) {
            $table->boolean('synced_to_finance')->default(false)->after('status');
            $table->foreignId('synced_by')->nullable()->constrained('users')->nullOnDelete()->after('synced_to_finance');
            $table->timestamp('synced_at')->nullable()->after('synced_by');
        });
    }

    public function down(): void
    {
        Schema::table('petty_cash_entries', function (Blueprint $table) {
            $table->dropForeign(['synced_by']);
            $table->dropColumn(['synced_to_finance', 'synced_by', 'synced_at']);
        });
    }
};
