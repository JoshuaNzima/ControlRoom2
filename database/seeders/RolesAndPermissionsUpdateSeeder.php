<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsUpdateSeeder extends Seeder
{
    public function run()
    {
        // Create new permissions
        $permissions = [
            // Zone Commander permissions
            'view_zone_dashboard',
            'manage_zone_guards',
            'view_zone_reports',
            'manage_zone_sites',
            'review_infractions',
            
            // Guard infractions permissions
            'create_infractions',
            'view_infractions',
            'manage_infractions',
            
            // Existing permissions to modify
            'view_guards',
            'manage_guards',
            'view_shifts',
            'manage_shifts',
            'view_attendance',
            'manage_attendance',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        // Create Zone Commander role
        $zoneCommanderRole = Role::create(['name' => 'zone_commander']);
        $zoneCommanderRole->givePermissionTo([
            'view_zone_dashboard',
            'manage_zone_guards',
            'view_zone_reports',
            'manage_zone_sites',
            'review_infractions',
            'view_guards',
            'manage_guards',
            'view_shifts',
            'manage_shifts',
            'view_attendance',
            'manage_attendance',
            'create_infractions',
            'view_infractions',
            'manage_infractions',
        ]);

        // Update Supervisor permissions (restrict access)
        $supervisorRole = Role::findByName('supervisor');
        $supervisorRole->revokePermissionTo([
            'manage_guards',
            'manage_shifts',
            'manage_attendance',
        ]);
        $supervisorRole->givePermissionTo([
            'view_guards',
            'view_shifts',
            'view_attendance',
            'create_infractions',
            'view_infractions',
        ]);

        // Ensure admin has all permissions
        $adminRole = Role::findByName('admin');
        $adminRole->givePermissionTo(Permission::all());
    }
}