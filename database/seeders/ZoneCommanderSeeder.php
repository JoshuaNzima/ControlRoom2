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

        $user->assignRole('zone_commander');
    }
}


