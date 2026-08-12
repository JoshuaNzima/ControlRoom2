<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UpdatedRolesSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Admin Permissions
            'admin.system.view',
            'admin.users.view',
            'admin.users.create',
            'admin.users.edit',
            'admin.users.delete',
            'admin.roles.view',
            'admin.roles.manage',
            'admin.settings.view',
            'admin.settings.manage',
            
            // Control Room Permissions
            'control.dashboard.view',
            'control.incidents.view',
            'control.incidents.create',
            'control.incidents.dispatch',
            'control.incidents.resolve',
            'control.alerts.view',
            'control.alerts.manage',
            'control.messaging.view',
            'control.messaging.send',
            'control.cameras.view',
            'control.reports.view',
            
            // Operations Permissions
            'operations.view',
            'operations.manage',
            'operations.reports.view',
            'operations.schedule.manage',
            
            // Finance Permissions
            'finance.dashboard.view',
            'finance.transactions.view',
            'finance.transactions.create',
            'finance.reports.view',
            'finance.invoices.manage',
            
            // Business Development Permissions
            'business.leads.view',
            'business.leads.create',
            'business.opportunities.manage',
            'business.reports.view',
            
            // Marketing Permissions
            'marketing.campaigns.view',
            'marketing.campaigns.create',
            'marketing.analytics.view',
            
            // Zone Management
            'zone.view',
            'zone.manage',
            'zone.reports.view',
            
            // General Permissions
            'reports.view',
            'reports.generate',
            'clients.view',
            'clients.manage',
            'staff.view',
            'staff.manage',
        ];

        // Create all permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Define roles and their permissions
        $roles = [
            'super_admin' => Permission::all(), // Super Admin gets all permissions
            
            'admin' => [
                'admin.system.view', 'admin.users.*', 'admin.roles.*', 'admin.settings.*',
                'reports.*', 'clients.*', 'staff.*'
            ],
            
            'supervisor' => [
                'staff.view', 'staff.manage', 'reports.view',
                'operations.view', 'operations.schedule.manage'
            ],
            
            'zone_commander' => [
                'zone.*', 'staff.view', 'reports.view', 'operations.view'
            ],
            
            'control_room_operator' => [
                'control.*', 'reports.view', 'clients.view'
            ],
            
            'operations_officer' => [
                'operations.*', 'staff.view', 'reports.view'
            ],
            
            'finance_officer' => [
                'finance.*', 'reports.view'
            ],
            
            'accountant' => [
                'finance.transactions.*', 'finance.reports.view'
            ],
            
            'marketing_officer' => [
                'marketing.*', 'reports.view'
            ],
            
            'business_development_officer' => [
                'business.*', 'reports.view'
            ],
            
            'administration_officer' => [
                'staff.view', 'reports.view', 'admin.users.view'
            ]
        ];

        // Create roles and assign permissions
        foreach ($roles as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            
            // Convert wildcard permissions to actual permissions
            $permissionsToAssign = collect($permissions)->map(function($permission) {
                if (str_ends_with($permission, '.*')) {
                    $prefix = rtrim($permission, '.*');
                    return Permission::where('name', 'like', $prefix . '.%')->pluck('name')->toArray();
                }
                return $permission;
            })->flatten()->toArray();
            
            $role->syncPermissions($permissionsToAssign);
        }
    }
}