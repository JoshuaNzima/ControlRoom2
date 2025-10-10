<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Guards\{ClientSite, Checkpoint};

class CheckpointSeeder extends Seeder
{
    public function run(): void
    {
        $sites = ClientSite::all();

        foreach ($sites as $site) {
            // Create main checkpoint for each site
            Checkpoint::create([
                'client_site_id' => $site->id,
                'name' => 'Main Entrance',
                'type' => 'qr',
                'description' => 'Primary checkpoint at main entrance',
                'is_active' => true,
                'requires_photo' => false,
                'scan_radius_meters' => 100,
                'latitude' => $site->latitude,
                'longitude' => $site->longitude,
            ]);
        }
    }
}