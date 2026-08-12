<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('requisitions', function (Blueprint $table) {
            $table->unsignedBigInteger('batch_id')->nullable()->after('notes_disbursement');
            $table->timestamp('batched_at')->nullable()->after('batch_id');
            $table->foreign('batch_id')->references('id')->on('requisition_batches')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('requisitions', function (Blueprint $table) {
            $table->dropForeign(['batch_id']);
            $table->dropColumn(['batch_id', 'batched_at']);
        });
    }
};
