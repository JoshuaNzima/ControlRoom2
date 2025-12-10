<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Guards\Client;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Checkpoint;

class CompanyOfficeSeeder extends Seeder
{
    public function run(): void
    {
        // Create an internal client to host company office sites
        $client = Client::firstOrCreate(
            ['name' => 'Company Internal'],
            [
                'status' => 'active',
                'monthly_rate' => 0,
                'billing_start_date' => now()->toDateString(),
                'address' => 'Internal account for company facilities',
            ]
        );

        // Create a Head Office site (site_type=office)
        $site = $client->sites()->firstOrCreate(
            ['name' => 'Head Office'],
            [
                'address' => 'Head Office',
                'status' => 'active',
                'required_guards' => 1,
                'site_type' => 'office',
            ]
        );

        // Ensure a main checkpoint exists for scanning at the office
        Checkpoint::firstOrCreate(
            [
                'client_site_id' => $site->id,
                'name' => 'Main Entrance',
            ],
            [
                'type' => 'qr',
                'description' => 'Primary checkpoint at office entrance',
                'is_active' => true,
                'requires_photo' => false,
                'scan_radius_meters' => 100,
                'latitude' => $site->latitude,
                'longitude' => $site->longitude,
            ]
        );
    }
}
