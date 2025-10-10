<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Create super admin specific permissions
        $superAdminPermissions = [
            'system.full_access',
            'modules.enable',
            'modules.disable',
            'modules.configure',
            'database.backup',
            'database.restore',
            'logs.view',
            'logs.delete',
            'settings.system',
            'settings.security',
            'audit.view',
            'audit.export',
            'users.impersonate',
            'system.maintenance',
        ];

        foreach ($superAdminPermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create or update super_admin role with ALL permissions
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin']);
        $superAdmin->givePermissionTo(Permission::all());

        // Create super admin user if doesn't exist
        $user = User::firstOrCreate(
            ['email' => 'superadmin@coinsec.com'],
            [
                'name' => 'Super Administrator',
                'password' => Hash::make('SuperSecure@2024'),
                'employee_id' => 'SUPER001',
                'email_verified_at' => now(),
            ]
        );

        $user->assignRole('super_admin');
    }
}