<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Conditionally create indexes only if they don't already exist to avoid duplicate-key errors
        $database = DB::getDatabaseName();

        $clientsIndex = DB::selectOne(
            'SELECT COUNT(1) AS cnt FROM information_schema.STATISTICS WHERE table_schema = ? AND table_name = ? AND column_name = ?'
            , [$database, 'clients', 'name']
        );

        if (empty($clientsIndex) || $clientsIndex->cnt == 0) {
            Schema::table('clients', function (Blueprint $table) {
                // Add index for name search optimization
                $table->index('name');
            });
        }

        // client_sites handled below (use separate check outside the Schema::table callback to avoid nesting DB calls inside)

        $clientSitesIndex = DB::selectOne(
            'SELECT COUNT(1) AS cnt FROM information_schema.STATISTICS WHERE table_schema = ? AND table_name = ? AND column_name = ?'
            , [$database, 'client_sites', 'client_id']
        );

        if (empty($clientSitesIndex) || $clientSitesIndex->cnt == 0) {
            Schema::table('client_sites', function (Blueprint $table) {
                // Add composite index for site and zone filtering
                $table->index(['client_id', 'zone_id']);
            });
        }

        $clientPaymentsIndex = DB::selectOne(
            'SELECT COUNT(1) AS cnt FROM information_schema.STATISTICS WHERE table_schema = ? AND table_name = ? AND column_name = ?'
            , [$database, 'client_payments', 'client_id']
        );

        if (empty($clientPaymentsIndex) || $clientPaymentsIndex->cnt == 0) {
            Schema::table('client_payments', function (Blueprint $table) {
                // Add indexes for payment status checks
                $table->index(['client_id', 'year', 'month']);
                $table->index(['year', 'month', 'paid']);
                // Add indexes for sorting
                $table->index(['client_id', 'year', 'amount_due']);
                $table->index(['client_id', 'year', 'amount_paid']);
                $table->index(['client_id', 'year', 'prepaid_amount']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex(['name']);
        });

        Schema::table('client_sites', function (Blueprint $table) {
            $table->dropIndex(['client_id', 'zone_id']);
        });

        Schema::table('client_payments', function (Blueprint $table) {
            $table->dropIndex(['client_id', 'year', 'month']);
            $table->dropIndex(['year', 'month', 'paid']);
            $table->dropIndex(['client_id', 'year', 'amount_due']);
            $table->dropIndex(['client_id', 'year', 'amount_paid']);
            $table->dropIndex(['client_id', 'year', 'prepaid_amount']);
        });
    }
};