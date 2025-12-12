<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->boolean('backdated')->default(false)->after('check_out_photo');
            $table->string('backdated_reason')->nullable()->after('backdated');
            $table->string('source')->nullable()->after('backdated_reason');
        });
    }

    public function down(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropColumn(['backdated', 'backdated_reason', 'source']);
        });
    }
};
