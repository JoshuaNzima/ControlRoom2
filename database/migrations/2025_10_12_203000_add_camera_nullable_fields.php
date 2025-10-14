<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cameras', function (Blueprint $table) {
            if (! Schema::hasColumn('cameras', 'ip_address')) {
                $table->string('ip_address')->nullable()->after('name');
            }
            if (! Schema::hasColumn('cameras', 'port')) {
                $table->integer('port')->nullable()->after('ip_address');
            }
            if (! Schema::hasColumn('cameras', 'username')) {
                $table->string('username')->nullable()->after('port');
            }
            if (! Schema::hasColumn('cameras', 'password')) {
                $table->string('password')->nullable()->after('username');
            }
            if (! Schema::hasColumn('cameras', 'model')) {
                $table->string('model')->nullable()->after('password');
            }
            if (! Schema::hasColumn('cameras', 'motion_detection')) {
                $table->boolean('motion_detection')->nullable()->after('model');
            }
            if (! Schema::hasColumn('cameras', 'night_vision')) {
                $table->boolean('night_vision')->nullable()->after('motion_detection');
            }
            if (! Schema::hasColumn('cameras', 'description')) {
                $table->text('description')->nullable()->after('night_vision');
            }
            if (! Schema::hasColumn('cameras', 'connection_status')) {
                $table->string('connection_status')->nullable()->after('description');
            }
            if (! Schema::hasColumn('cameras', 'last_connection_test')) {
                $table->timestamp('last_connection_test')->nullable()->after('connection_status');
            }
            if (! Schema::hasColumn('cameras', 'last_restart')) {
                $table->timestamp('last_restart')->nullable()->after('last_connection_test');
            }
            if (! Schema::hasColumn('cameras', 'created_by')) {
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete()->after('site_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cameras', function (Blueprint $table) {
            $cols = [
                'ip_address','port','username','password','model','motion_detection','night_vision','description','connection_status','last_connection_test','last_restart','created_by'
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('cameras', $col)) {
                    // drop foreign first if needed
                    if (in_array($col, ['created_by'])) {
                        $table->dropForeign([$col]);
                    }
                    $table->dropColumn($col);
                }
            }
        });
    }
};
