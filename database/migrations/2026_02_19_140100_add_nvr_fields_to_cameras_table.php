<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cameras', function (Blueprint $table) {
            if (! Schema::hasColumn('cameras', 'source_type')) {
                $table->enum('source_type', ['standalone', 'nvr', 'dvr', 'ip_camera'])->default('standalone')->after('client_site_id');
            }
            if (! Schema::hasColumn('cameras', 'nvr_device_id')) {
                $table->foreignId('nvr_device_id')->nullable()->constrained('nvr_devices')->nullOnDelete()->after('source_type');
            }
            if (! Schema::hasColumn('cameras', 'nvr_channel')) {
                $table->integer('nvr_channel')->nullable()->after('nvr_device_id');
            }
            if (! Schema::hasColumn('cameras', 'stream_type')) {
                $table->enum('stream_type', ['hls', 'rtsp', 'webrtc', 'mjpeg', 'http'])->default('hls')->after('stream_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cameras', function (Blueprint $table) {
            $table->dropConstrainedForeignId('nvr_device_id');
            foreach (['source_type', 'nvr_channel', 'stream_type'] as $col) {
                if (Schema::hasColumn('cameras', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
