<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'ticket_number')) {
                $table->string('ticket_number')->nullable()->unique()->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (Schema::hasColumn('tickets', 'ticket_number')) {
                $table->dropUnique(['ticket_number']);
                $table->dropColumn('ticket_number');
            }
        });
    }
};
