<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class GuardPermissionSeeder extends Seeder
{
    public function run()
    {
        // Create permissions
        $permissions = [
            'assign_guard_supervisor',
            'view_guard_supervisor',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Assign to admin role
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $adminRole->givePermissionTo($permissions);

        // Assign to manager role if exists
        if ($managerRole = Role::where('name', 'manager')->first()) {
            $managerRole->givePermissionTo($permissions);
        }
    }
}