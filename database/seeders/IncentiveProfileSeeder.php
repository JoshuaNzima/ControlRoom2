<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\IncentiveProfile;

class IncentiveProfileSeeder extends Seeder
{
    public function run(): void
    {
        // Create default incentive profiles if they don't exist
        $profiles = [
            [
                'role' => 'supervisor',
                'base_amount' => 2000.00,
                'penalty_per_unresolved_down' => 100.00,
                'is_active' => true,
                'description' => 'Monthly incentive for supervisors. Deducted R100 for each unresolved down under their supervision.',
            ],
            [
                'role' => 'sergeant',
                'base_amount' => 1500.00,
                'penalty_per_unresolved_down' => 75.00,
                'is_active' => true,
                'description' => 'Monthly incentive for sergeants. Deducted R75 for each unresolved down in their zone.',
            ],
        ];

        foreach ($profiles as $profile) {
            IncentiveProfile::firstOrCreate(
                ['role' => $profile['role']],
                $profile
            );
        }
    }
}
