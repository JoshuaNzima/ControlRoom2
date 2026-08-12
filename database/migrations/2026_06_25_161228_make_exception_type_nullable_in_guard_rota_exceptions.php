<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The `exception_type` column is no longer the primary discriminator — `intent` is.
     * Make it nullable so new rows can be created with only `intent` set.
     */
    public function up(): void
    {
        Schema::table('guard_rota_exceptions', function (Blueprint $table) {
            $table->string('exception_type', 50)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guard_rota_exceptions', function (Blueprint $table) {
            $table->string('exception_type', 50)->nullable(false)->change();
        });
    }
};
