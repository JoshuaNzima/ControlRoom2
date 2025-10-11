<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ControlRoomOperatorSeeder extends Seeder
{
    public function run(): void
    {
        // Create control room operator user
        $user = User::firstOrCreate(
            ['email' => 'controlroom@coinsec.com'],
            [
                'name' => 'Control Room Operator',
                'password' => Hash::make('ControlRoom@2024'),
                'employee_id' => 'CTRL001',
                'email_verified_at' => now(),
            ]
        );

        // Assign control room operator role
        $user->assignRole('control_room_operator');

        // Create additional control room operators
        $operators = [
            [
                'name' => 'John Control Operator',
                'email' => 'john.control@coinsec.com',
                'employee_id' => 'CTRL002',
                'password' => Hash::make('ControlRoom@2024'),
            ],
            [
                'name' => 'Sarah Control Operator',
                'email' => 'sarah.control@coinsec.com',
                'employee_id' => 'CTRL003',
                'password' => Hash::make('ControlRoom@2024'),
            ],
        ];

        foreach ($operators as $operatorData) {
            $operator = User::firstOrCreate(
                ['email' => $operatorData['email']],
                array_merge($operatorData, [
                    'email_verified_at' => now(),
                ])
            );
            $operator->assignRole('control_room_operator');
        }
    }
}
