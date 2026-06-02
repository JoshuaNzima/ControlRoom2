<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            // Nullable FK so existing guards keep working without a template.
            $table->foreignId('rota_template_id')
                ->nullable()
                ->after('default_off_day')
                ->constrained('rota_templates')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            $table->dropForeign(['rota_template_id']);
            $table->dropColumn('rota_template_id');
        });
    }
};

