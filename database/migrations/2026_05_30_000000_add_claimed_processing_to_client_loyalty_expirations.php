<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_loyalty_expirations', function (Blueprint $table) {
            $table->boolean('claimed')->default(false)->after('expires_at');
            $table->timestamp('claimed_at')->nullable()->after('claimed');
            $table->boolean('processing')->default(false)->after('claimed_at');
            $table->timestamp('processing_at')->nullable()->after('processing');
        });
    }

    public function down(): void
    {
        Schema::table('client_loyalty_expirations', function (Blueprint $table) {
            $table->dropColumn('processing_at');
            $table->dropColumn('processing');
            $table->dropColumn('claimed_at');
            $table->dropColumn('claimed');
        });
    }
};
