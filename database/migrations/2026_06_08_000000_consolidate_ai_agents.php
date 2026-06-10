<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Consolidate old assistant records into the new app-assistant
        // First, create the new app-assistant record if it doesn't exist
        DB::table('ai_assistant_settings')->updateOrInsert(
            ['assistant' => 'app-assistant'],
            [
                'enabled' => true,
                'title' => 'AI Assistant',
                'description' => 'Consolidated assistant for all user interactions',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // Disable the old agents
        DB::table('ai_assistant_settings')
            ->whereIn('assistant', ['control-room', 'help-center'])
            ->update(['enabled' => false]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-enable the old agents if they exist
        DB::table('ai_assistant_settings')
            ->whereIn('assistant', ['control-room', 'help-center'])
            ->update(['enabled' => true]);

        // Disable the new app-assistant
        DB::table('ai_assistant_settings')
            ->where('assistant', 'app-assistant')
            ->update(['enabled' => false]);
    }
};
