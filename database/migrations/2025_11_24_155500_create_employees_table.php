<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Intentionally left blank: HR will manage Guards and Users, not a separate employees table.
    }

    public function down(): void
    {
        // No-op
    }
};
