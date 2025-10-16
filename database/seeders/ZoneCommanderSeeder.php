<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class ZoneCommanderSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'commander@example.com'],
            [
                'name' => 'Zone Commander',
                'password' => bcrypt('password'),
                'status' => 'active',
            ]
        );

        // Ensure there's at least one Zone and assign the user to it to avoid missing zone_id issues
        $zone = \App\Models\Zone::first();
        if (!$zone) {
            $zone = \App\Models\Zone::create(['name' => 'Default Zone', 'code' => 'ZN-DEFAULT']);
        }

        $user->zone_id = $zone->id;
        $user->save();

        $user->assignRole('zone_commander');
    }
}


