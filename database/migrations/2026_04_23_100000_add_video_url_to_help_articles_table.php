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
        Schema::table('help_articles', function (Blueprint $table) {
            $table->string('video_url')->nullable()->after('content')->comment('URL to video tutorial (YouTube, Vimeo, etc.)');
            $table->integer('estimated_reading_time')->nullable()->after('video_url')->comment('Estimated reading time in minutes');
            $table->boolean('featured')->default(false)->after('is_published')->comment('Featured article shown prominently');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('help_articles', function (Blueprint $table) {
            $table->dropColumn(['video_url', 'estimated_reading_time', 'featured']);
        });
    }
};
