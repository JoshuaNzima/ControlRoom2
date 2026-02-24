<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_trainee_trainers', function (Blueprint $table) {
            $table->index(['trainer_id', 'is_primary']);
        });
    }

    public function down(): void
    {
        Schema::table('training_trainee_trainers', function (Blueprint $table) {
            $table->dropIndex(['trainer_id', 'is_primary']);
        });
    }
};
