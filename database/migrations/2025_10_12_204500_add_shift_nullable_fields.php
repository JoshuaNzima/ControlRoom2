<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            if (! Schema::hasColumn('shifts', 'notes')) {
                $table->text('notes')->nullable()->after('end_time');
            }
            if (! Schema::hasColumn('shifts', 'reason_for_cancellation')) {
                $table->text('reason_for_cancellation')->nullable()->after('notes');
            }
            if (! Schema::hasColumn('shifts', 'actual_start_time')) {
                $table->timestamp('actual_start_time')->nullable()->after('start_time');
            }
            if (! Schema::hasColumn('shifts', 'actual_end_time')) {
                $table->timestamp('actual_end_time')->nullable()->after('actual_start_time');
            }
            if (! Schema::hasColumn('shifts', 'is_overtime')) {
                $table->boolean('is_overtime')->nullable()->after('actual_end_time');
            }
            if (! Schema::hasColumn('shifts', 'overtime_hours')) {
                $table->decimal('overtime_hours', 5, 2)->nullable()->after('is_overtime');
            }
            if (! Schema::hasColumn('shifts', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete()->after('overtime_hours');
            }
            if (! Schema::hasColumn('shifts', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
            if (! Schema::hasColumn('shifts', 'name')) {
                $table->string('name')->nullable()->after('id');
            }
            if (! Schema::hasColumn('shifts', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (! Schema::hasColumn('shifts', 'supervisor_id')) {
                $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete()->after('description');
            }
            if (! Schema::hasColumn('shifts', 'required_guards')) {
                $table->integer('required_guards')->nullable()->after('supervisor_id');
            }
            if (! Schema::hasColumn('shifts', 'sites')) {
                $table->json('sites')->nullable()->after('required_guards');
            }
            if (! Schema::hasColumn('shifts', 'created_by')) {
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete()->after('sites');
            }
        });
    }

    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            $cols = [
                'notes','reason_for_cancellation','actual_start_time','actual_end_time','is_overtime','overtime_hours','approved_by','approved_at','name','description','supervisor_id','required_guards','sites','created_by'
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('shifts', $col)) {
                    if (in_array($col, ['approved_by','supervisor_id','created_by'])) {
                        $table->dropForeign([$col]);
                    }
                    $table->dropColumn($col);
                }
            }
        });
    }
};
