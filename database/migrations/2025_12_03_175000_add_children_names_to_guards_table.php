<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            if (!Schema::hasColumn('guards', 'children_names')) {
                $table->text('children_names')->nullable()->after('number_of_children');
            }
        });
    }

    public function down(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            if (Schema::hasColumn('guards', 'children_names')) {
                $table->dropColumn('children_names');
            }
        });
    }
};
