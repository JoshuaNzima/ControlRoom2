<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // camera_alerts: add message/resolved_by/resolved_at
        Schema::table('camera_alerts', function (Blueprint $table) {
            if (! Schema::hasColumn('camera_alerts', 'message')) {
                $table->text('message')->nullable()->after('description');
            }
            if (! Schema::hasColumn('camera_alerts', 'resolved_by')) {
                $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete()->after('acknowledged_at');
            }
            if (! Schema::hasColumn('camera_alerts', 'resolved_at')) {
                $table->timestamp('resolved_at')->nullable()->after('resolved_by');
            }
        });

        // camera_recordings: add filename, file_size, duration, quality if missing
        Schema::table('camera_recordings', function (Blueprint $table) {
            if (! Schema::hasColumn('camera_recordings', 'filename')) {
                $table->string('filename')->nullable()->after('file_path');
            }
            if (! Schema::hasColumn('camera_recordings', 'file_size')) {
                $table->integer('file_size')->nullable()->after('filename');
            }
            if (! Schema::hasColumn('camera_recordings', 'duration')) {
                $table->integer('duration')->nullable()->after('file_size');
            }
            if (! Schema::hasColumn('camera_recordings', 'quality')) {
                $table->string('quality')->nullable()->after('duration');
            }
        });

        // messages: add is_emergency and read_at
        Schema::table('messages', function (Blueprint $table) {
            if (! Schema::hasColumn('messages', 'is_emergency')) {
                $table->boolean('is_emergency')->nullable()->after('type');
            }
            if (! Schema::hasColumn('messages', 'read_at')) {
                $table->timestamp('read_at')->nullable()->after('is_emergency');
            }
        });

        // conversations: add name if used by model
        Schema::table('conversations', function (Blueprint $table) {
            if (! Schema::hasColumn('conversations', 'name')) {
                $table->string('name')->nullable()->after('title');
            }
        });

        // guard_assignments: add is_active (if missing) — but model expects is_active
        Schema::table('guard_assignments', function (Blueprint $table) {
            if (! Schema::hasColumn('guard_assignments', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('notes');
            }
        });

        // relievers: add expected fields
        Schema::table('relievers', function (Blueprint $table) {
            if (! Schema::hasColumn('relievers', 'guard_id')) {
                $table->foreignId('guard_id')->nullable()->constrained('guards')->nullOnDelete()->after('id');
            }
            if (! Schema::hasColumn('relievers', 'name')) {
                $table->string('name')->nullable()->after('guard_id');
            }
            if (! Schema::hasColumn('relievers', 'type')) {
                $table->string('type')->nullable()->after('name');
            }
            if (! Schema::hasColumn('relievers', 'status')) {
                $table->string('status')->nullable()->after('type');
            }
            if (! Schema::hasColumn('relievers', 'phone')) {
                $table->string('phone')->nullable()->after('status');
            }
            if (! Schema::hasColumn('relievers', 'email')) {
                $table->string('email')->nullable()->after('phone');
            }
            if (! Schema::hasColumn('relievers', 'notes')) {
                $table->text('notes')->nullable()->after('email');
            }
        });
    }

    public function down(): void
    {
        Schema::table('camera_alerts', function (Blueprint $table) {
            foreach (['message','resolved_by','resolved_at'] as $c) {
                if (Schema::hasColumn('camera_alerts', $c)) {
                    if ($c === 'resolved_by') $table->dropForeign([$c]);
                    $table->dropColumn($c);
                }
            }
        });

        Schema::table('camera_recordings', function (Blueprint $table) {
            foreach (['filename','file_size','duration','quality'] as $c) {
                if (Schema::hasColumn('camera_recordings', $c)) {
                    $table->dropColumn($c);
                }
            }
        });

        Schema::table('messages', function (Blueprint $table) {
            foreach (['is_emergency','read_at'] as $c) {
                if (Schema::hasColumn('messages', $c)) {
                    $table->dropColumn($c);
                }
            }
        });

        Schema::table('conversations', function (Blueprint $table) {
            if (Schema::hasColumn('conversations', 'name')) {
                $table->dropColumn('name');
            }
        });

        Schema::table('guard_assignments', function (Blueprint $table) {
            if (Schema::hasColumn('guard_assignments', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });

        Schema::table('relievers', function (Blueprint $table) {
            foreach (['guard_id','name','type','status','phone','email','notes'] as $c) {
                if (Schema::hasColumn('relievers', $c)) {
                    if ($c === 'guard_id') $table->dropForeign([$c]);
                    $table->dropColumn($c);
                }
            }
        });
    }
};
