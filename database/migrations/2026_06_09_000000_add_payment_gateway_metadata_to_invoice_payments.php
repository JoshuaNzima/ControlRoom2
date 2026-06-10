<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_payments', function (Blueprint $table) {
            $table->string('gateway_name', 64)->nullable()->after('payment_method');
            $table->string('gateway_transaction_id', 128)->nullable()->after('gateway_name');
            $table->string('gateway_status', 64)->nullable()->after('gateway_transaction_id');
            $table->string('gateway_reference', 255)->nullable()->after('gateway_status');
            $table->text('gateway_payload')->nullable()->after('gateway_reference');
            $table->dateTime('gateway_paid_at')->nullable()->after('gateway_payload');
        });
    }

    public function down(): void
    {
        Schema::table('invoice_payments', function (Blueprint $table) {
            $table->dropColumn([
                'gateway_name',
                'gateway_transaction_id',
                'gateway_status',
                'gateway_reference',
                'gateway_payload',
                'gateway_paid_at',
            ]);
        });
    }
};
