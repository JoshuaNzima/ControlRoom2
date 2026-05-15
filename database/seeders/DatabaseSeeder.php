<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Ensure a baseline user exists only if email is not taken
        if (!User::where('email', 'test@example.com')->exists()) {
            User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);
        }

        // Default AI assistants
        \App\Models\AiAssistantSetting::query()->firstOrCreate(
            ['assistant' => 'control-room'],
            ['enabled' => true, 'title' => 'Control Room Assistant', 'description' => 'Helps with control-room usage and guides.']
        );

        \App\Models\AiAssistantSetting::query()->firstOrCreate(
            ['assistant' => 'help-center'],
            ['enabled' => false, 'title' => 'Help Center Assistant', 'description' => 'Helps find Help Center articles and create guides.']
        );

        // If both somehow ended up enabled, force control-room as active
        \App\Models\AiAssistantSetting::query()
            ->where('assistant', 'help-center')
            ->update(['enabled' => false]);
        \App\Models\AiAssistantSetting::query()
            ->where('assistant', 'control-room')
            ->update(['enabled' => true]);

         $this->call([
            RolesAndPermissionsSeeder::class,
            AdminUserSeeder::class,
            GuardsModuleSeeder::class,
            ModuleSeeder::class,
            SuperAdminSeeder::class,
            ControlRoomOperatorSeeder::class,
            ZoneCommanderSeeder::class,
            CheckpointSeeder::class,
            ModularPermissionsSeeder::class,
            DefaultModulesSeeder::class,            
            ZoneCommanderDemoSeeder::class,
            MarketingAndAssetRolesSeeder::class,
        ]);
    }
}
