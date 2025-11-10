<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class OperationsOfficerSeeder extends Seeder
{
    public function run()
    {
        // Create operations officer role
        $role = Role::findOrCreate('operations_officer');

        // Create permissions
        $permissions = [
            'control.dashboard.view',
            'zones.view',
            'zones.manage',
            'monitoring.view',
            'operations.access',
            'guards.view',
            'guards.manage',
            'shifts.view',
            'shifts.manage',
            'incidents.view',
            'incidents.manage',
            'alerts.view',
            'alerts.manage',
            'cameras.view',
            'downs.view',
            'downs.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        // Assign permissions to operations officer role
        $role->givePermissionTo($permissions);

        // Also ensure admin role has these permissions
        if ($adminRole = Role::where('name', 'admin')->first()) {
            $adminRole->givePermissionTo($permissions);
        }
    }
}