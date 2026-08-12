<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cameras', function (Blueprint $table) {
            if (! Schema::hasColumn('cameras', 'public_protocol')) {
                $table->string('public_protocol')->nullable()->after('stream_url');
            }
            if (! Schema::hasColumn('cameras', 'public_host')) {
                $table->string('public_host')->nullable()->after('public_protocol');
            }
            if (! Schema::hasColumn('cameras', 'public_port')) {
                $table->integer('public_port')->nullable()->after('public_host');
            }
            if (! Schema::hasColumn('cameras', 'public_path')) {
                $table->string('public_path')->nullable()->after('public_port');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cameras', function (Blueprint $table) {
            foreach (['public_protocol', 'public_host', 'public_port', 'public_path'] as $col) {
                if (Schema::hasColumn('cameras', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
