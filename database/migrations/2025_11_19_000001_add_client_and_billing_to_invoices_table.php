<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('client_id')
                ->nullable()
                ->after('user_id')
                ->constrained('clients')
                ->nullOnDelete();

            $table->unsignedSmallInteger('billing_year')
                ->nullable()
                ->after('due_date');

            $table->unsignedTinyInteger('billing_month')
                ->nullable()
                ->after('billing_year');

            $table->index(['client_id', 'billing_year', 'billing_month'], 'invoices_client_billing_index');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('invoices_client_billing_index');
            $table->dropColumn(['billing_month', 'billing_year']);
            $table->dropConstrainedForeignId('client_id');
        });
    }
};
