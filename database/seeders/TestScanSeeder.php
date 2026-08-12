<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ScanTag;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Checkpoint;
use App\Models\Guards\CheckpointScan;
use App\Models\User;

class TestScanSeeder extends Seeder
{
    public function run(): void
    {
        $guards = Guard::where('status', 'active')->get();
        $sites = ClientSite::with('client')->get();
        $users = User::limit(5)->get();

        if ($guards->count() === 0 || $sites->count() === 0) {
            $this->command->error('No guards or sites found');
            return;
        }

        // Create checkpoints for each site if not exist
        foreach ($sites as $site) {
            for ($i = 1; $i <= 3; $i++) {
                Checkpoint::firstOrCreate(
                    ['code' => 'CP-' . $site->id . '-' . $i],
                    [
                        'client_site_id' => $site->id,
                        'name' => 'Checkpoint ' . $i,
                        'type' => 'qr',
                        'is_active' => true,
                        'latitude' => -15.4 + (rand(-100, 100) / 1000),
                        'longitude' => 28.2 + (rand(-100, 100) / 1000),
                    ]
                );
            }
        }

        $checkpoints = Checkpoint::all();
        $supervisor = $users->first() ?? User::first();

        if (!$supervisor) {
            $this->command->error('No user found for supervisor');
            return;
        }

        for ($i = 0; $i < 20; $i++) {
            $guard = $guards->random();
            $site = $sites->random();
            $checkpoint = $checkpoints->where('client_site_id', $site->id)->first() ?? $checkpoints->random();
            $scanTypes = ['check_in', 'check_out', 'patrol'];
            $qualities = ['high', 'medium', 'low'];
            $verified = rand(0, 1) === 1;

            // Create checkpoint scan
            $checkpointScan = CheckpointScan::create([
                'checkpoint_id' => $checkpoint->id,
                'supervisor_id' => $supervisor->id,
                'scanned_at' => now()->subMinutes(rand(1, 120)),
                'latitude' => -15.4 + (rand(-100, 100) / 1000),
                'longitude' => 28.2 + (rand(-100, 100) / 1000),
                'location_verified' => $verified,
            ]);

            // Create scan tag
            ScanTag::create([
                'checkpoint_scan_id' => $checkpointScan->id,
                'tags' => [
                    'guard_name' => $guard->name ?? 'Guard ' . $guard->id,
                    'supervisor_name' => $supervisor->name ?? 'Supervisor',
                    'site_name' => $site->name ?? 'Site ' . $site->id,
                    'checkpoint_name' => $checkpoint->name ?? 'Checkpoint',
                    'client_name' => $site->client?->name ?? 'Client',
                    'scan_type' => $scanTypes[array_rand($scanTypes)],
                    'location_verified' => $verified,
                    'location_quality' => $qualities[array_rand($qualities)],
                    'scanned_at' => now()->subMinutes(rand(1, 120))->toIso8601String(),
                ],
                'created_at' => now()->subMinutes(rand(1, 120)),
            ]);
        }

        $this->command->info('Created 20 test scans with checkpoints');
    }
}
