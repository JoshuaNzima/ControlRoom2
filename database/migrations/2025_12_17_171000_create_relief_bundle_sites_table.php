<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('relief_bundle_sites', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('relief_bundle_id');
            $table->unsignedBigInteger('client_site_id');
            $table->unsignedTinyInteger('position')->default(1);
            $table->timestamps();

            $table->foreign('relief_bundle_id')->references('id')->on('relief_bundles')->onDelete('cascade');
            $table->foreign('client_site_id')->references('id')->on('client_sites')->onDelete('cascade');
            $table->unique(['relief_bundle_id','client_site_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relief_bundle_sites');
    }
};
