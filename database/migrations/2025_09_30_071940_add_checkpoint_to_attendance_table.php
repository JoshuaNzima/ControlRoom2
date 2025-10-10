<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->foreignId('checkpoint_scan_id')->nullable()->constrained('checkpoint_scans')->after('client_site_id');
            $table->boolean('location_verified')->default(false)->after('check_out_photo');
            $table->decimal('check_in_latitude', 10, 8)->nullable()->after('location_verified');
            $table->decimal('check_in_longitude', 11, 8)->nullable()->after('check_in_latitude');
        });
    }

    public function down(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropForeign(['checkpoint_scan_id']);
            $table->dropColumn(['checkpoint_scan_id', 'location_verified', 'check_in_latitude', 'check_in_longitude']);
        });
    }
};