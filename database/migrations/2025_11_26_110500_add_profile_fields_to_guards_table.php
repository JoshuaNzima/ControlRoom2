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
            if (!Schema::hasColumn('guards', 'marital_status')) {
                $table->string('marital_status')->nullable()->after('gender');
            }
            if (!Schema::hasColumn('guards', 'number_of_children')) {
                $table->unsignedInteger('number_of_children')->nullable()->after('marital_status');
            }
            if (!Schema::hasColumn('guards', 'home_village_details')) {
                $table->text('home_village_details')->nullable()->after('address');
            }
            if (!Schema::hasColumn('guards', 'current_residence_details')) {
                $table->text('current_residence_details')->nullable()->after('home_village_details');
            }
            if (!Schema::hasColumn('guards', 'qualification')) {
                $table->string('qualification')->nullable()->after('current_residence_details');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            if (Schema::hasColumn('guards', 'qualification')) {
                $table->dropColumn('qualification');
            }
            if (Schema::hasColumn('guards', 'current_residence_details')) {
                $table->dropColumn('current_residence_details');
            }
            if (Schema::hasColumn('guards', 'home_village_details')) {
                $table->dropColumn('home_village_details');
            }
            if (Schema::hasColumn('guards', 'number_of_children')) {
                $table->dropColumn('number_of_children');
            }
            if (Schema::hasColumn('guards', 'marital_status')) {
                $table->dropColumn('marital_status');
            }
        });
    }
};
