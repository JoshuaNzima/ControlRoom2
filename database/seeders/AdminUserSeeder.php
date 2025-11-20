<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@coinsec.com'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('password'),
                'employee_id' => 'ADM001',
                'phone' => '+1234567890',
                'email_verified_at' => now(),
            ]
        );
        $admin->assignRole('admin');

        // Create manager user
        $manager = User::firstOrCreate(
            ['email' => 'manager@coinsec.com'],
            [
                'name' => 'Operations Manager',
                'password' => Hash::make('password'),
                'employee_id' => 'MGR001',
                'phone' => '+1234567891',
                'email_verified_at' => now(),
            ]
        );
        $manager->assignRole('manager');

        // Create supervisor user
        $supervisor = User::firstOrCreate(
            ['email' => 'supervisor@coinsec.com'], 
            [
                'name' => 'Site Supervisor',
                'password' => Hash::make('password'),
                'employee_id' => 'SUP001',
                'phone' => '+1234567892',
                'email_verified_at' => now(),
            ]
        );
        $supervisor->assignRole('supervisor');

        // Create demo client user
        $client = User::firstOrCreate(
            ['email' => 'client@example.com'],
            [
                'name' => 'Client Representative',
                'password' => Hash::make('password'),
                'employee_id' => 'CLT001',
                'phone' => '+1234567893', 
                'email_verified_at' => now(),
            ]
        );
        $client->assignRole('client');
    
    }
}
