<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class OperationsManagerPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Create operations permissions if they don't exist
        $permissions = [
            'operations.dashboard.view',
            'operations.approvals.manage',
            'operations.reports.export'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Get or create the manager role
        $managerRole = Role::firstOrCreate(['name' => 'manager']);

        // Assign the permissions to the manager role
        $managerRole->givePermissionTo($permissions);
    }
}