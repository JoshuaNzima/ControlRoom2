<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            // Marital information
            $table->enum('marital_status', ['single','married','divorced','widowed'])->nullable()->after('gender');
            $table->string('spouse_name')->nullable()->after('marital_status');
            $table->string('spouse_phone')->nullable()->after('spouse_name');

            // Next of kin
            $table->string('next_of_kin_name')->nullable()->after('emergency_contact_phone');
            $table->string('next_of_kin_relationship')->nullable()->after('next_of_kin_name');
            $table->string('next_of_kin_phone')->nullable()->after('next_of_kin_relationship');

            // Residence information
            $table->string('residence_address')->nullable()->after('address');
            $table->string('residence_city')->nullable()->after('residence_address');
            $table->string('residence_district')->nullable()->after('residence_city');

            // Home info (village/origin)
            $table->string('home_village')->nullable()->after('residence_district');
            $table->string('home_ta')->nullable()->after('home_village');
            $table->string('home_district')->nullable()->after('home_ta');

            // Qualifications & education
            $table->string('education_level')->nullable()->after('home_district');
            $table->json('qualifications')->nullable()->after('education_level');
            $table->json('languages')->nullable()->after('qualifications');
            $table->unsignedInteger('dependents_count')->nullable()->after('languages');
        });
    }

    public function down(): void
    {
        Schema::table('guards', function (Blueprint $table) {
            $table->dropColumn([
                'marital_status','spouse_name','spouse_phone',
                'next_of_kin_name','next_of_kin_relationship','next_of_kin_phone',
                'residence_address','residence_city','residence_district',
                'home_village','home_ta','home_district',
                'education_level','qualifications','languages','dependents_count'
            ]);
        });
    }
};
