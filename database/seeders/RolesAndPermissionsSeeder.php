<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Guards module
            'guards.view',
            'guards.create',
            'guards.edit',
            'guards.delete',
            'guards.assign',
            'attendance.view',
            'attendance.manage',
            'attendance.export',
            'shifts.view',
            'shifts.manage',
            'incidents.view',
            'incidents.create',
            'incidents.manage',
            'guards.operations.view',
            'guards.sergeants.view',
            'guards.sergeants.manage',
            'guards.calendar.view',
            
            // HR module
            'hr.employees.view',
            'hr.employees.create',
            'hr.employees.edit',
            'hr.employees.delete',
            'hr.leaves.view',
            'hr.leaves.approve',
            'hr.archived.view',
            'hr.resigned.view',
            'hr.dismissed.view',
            
            // Clients module
            'clients.view',
            'clients.create',
            'clients.edit',
            'clients.delete',
            'clients.sites.manage',
            
            // K9 module
            'k9.view',
            'k9.dogs.manage',
            'k9.handlers.manage',
            
            // Control Room module
            'control.dashboard.view',
            'control.dashboard.manage',
            'control.incidents.view',
            'control.incidents.create',
            'control.incidents.dispatch',
            'control.incidents.resolve',
            'control.alerts.view',
            'control.alerts.manage',
            'control.alerts.escalate',
            'control.messaging.view',
            'control.messaging.send',
            'control.cameras.view',
            'control.cameras.manage',
            'control.zones.view',
            'control.zones.manage',
            'control.reports.view',
            'control.reports.generate',
            'control.qr_codes.view',
            'control.qr_codes.generate',
            'zone.view.dashboard',
            
            // Reports module
            'reports.view',
            'reports.generate',
            'reports.export',
            'reports.analytics',
            'reports.activity_logs.view',
            
            // Admin module
            'admin.system.view',
            'admin.users.view',
            'admin.users.create',
            'admin.users.edit',
            'admin.users.delete',
            'admin.roles.view',
            'admin.roles.manage',
            'admin.modules.manage',
            'admin.settings.view',
            'admin.settings.manage',
            // Finance module
            'finance.access',
            'finance.view',
            'finance.manage',
            'finance.invoices.view',
            'finance.invoices.manage',
            'finance.budgets.view',
            'finance.budgets.manage',

            // Requisitions module
            'requisitions.create',
            'requisitions.view_own',
            'requisitions.view_all',
            'requisitions.approve',
            'requisitions.disburse',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create roles and assign permissions
        
        // Admin role - has all permissions
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        // Manager role - most permissions except system settings
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $managerRole->givePermissionTo([
            'guards.view', 'guards.edit', 'guards.assign',
            'attendance.view', 'attendance.manage', 'attendance.export',
            'shifts.view', 'shifts.manage',
            'incidents.view', 'incidents.create',
            'guards.operations.view', 'guards.sergeants.view',
            'guards.calendar.view',
            
            'hr.employees.view', 'hr.employees.edit',
            'hr.leaves.view', 'hr.leaves.approve',
            
            'clients.view', 'clients.edit', 'clients.sites.manage',
            
            'k9.view',
            
            'control.dashboard.view', 'control.incidents.view',
            'control.alerts.view',
            
            'reports.view', 'reports.generate', 'reports.export',
            'reports.activity_logs.view',
            
            'admin.users.view', 'admin.users.create', 'admin.users.edit',
            // Requisitions
            'requisitions.create', 'requisitions.view_own',
        ]);

        // Supervisor role - limited to attendance and viewing
        $supervisorRole = Role::firstOrCreate(['name' => 'supervisor']);
        $supervisorRole->givePermissionTo([
            'guards.view',
            'attendance.view', 'attendance.manage',
            'shifts.view',
            'incidents.view',
            'reports.view',
            'clients.view',
            // Requisitions
            'requisitions.create', 'requisitions.view_own',
        ]);

        // Zone Commander role - manages a specific zone
        $zoneCommanderRole = Role::firstOrCreate(['name' => 'zone_commander']);
        $zoneCommanderRole->givePermissionTo([
            'guards.view',
            'attendance.view',
            'shifts.view',
            'incidents.view',
            'reports.view',
            'clients.view',
            'zone.view.dashboard',
            'control.zones.view',
            'control.reports.view',
            // Requisitions
            'requisitions.create', 'requisitions.view_own',
        ]);

        // Control Room Operator role - dedicated control room access
        $controlRoomRole = Role::firstOrCreate(['name' => 'control_room_operator']);
        $controlRoomRole->givePermissionTo([
            'control.dashboard.view',
            'control.dashboard.manage',
            'control.incidents.view',
            'control.incidents.create',
            'control.incidents.dispatch',
            'control.incidents.resolve',
            'control.alerts.view',
            'control.alerts.manage',
            'control.alerts.escalate',
            'control.messaging.view',
            'control.messaging.send',
            'control.cameras.view',
            'control.cameras.manage',
            'control.zones.view',
            'control.zones.manage',
            'control.reports.view',
            'control.reports.generate',
            'control.qr_codes.view',
            'control.qr_codes.generate',
            'guards.view', // Need to see guards for assignments
            'clients.view', // Need to see clients for incidents
            // Requisitions
            'requisitions.create', 'requisitions.view_own',
        ]);

        // Operations Officer - oversees control room, guards and zone operations
        $operationsOfficerRole = Role::firstOrCreate(['name' => 'operations_officer']);
        $operationsOfficerPermissions = array_unique(array_merge(
            $managerRole->permissions->pluck('name')->toArray(),
            $controlRoomRole->permissions->pluck('name')->toArray(),
            Permission::whereIn('name', [
                'reports.view',
                'reports.generate',
                'reports.export',
                'reports.analytics',
            ])->pluck('name')->toArray()
        ));
        $operationsOfficerRole->givePermissionTo($operationsOfficerPermissions);

        // Client role - very limited access
        $clientRole = Role::firstOrCreate(['name' => 'client']);
        $clientRole->givePermissionTo([
            'guards.view', // Only assigned guards
            'attendance.view', // Only their sites
            'reports.view', // Only their reports
            // Requisitions
            'requisitions.create', 'requisitions.view_own',
        ]);

        // Finance roles
        $financeOfficer = Role::firstOrCreate(['name' => 'finance_officer']);
        $financeOfficer->givePermissionTo([
            'finance.access', 'finance.view', 'finance.manage',
            'finance.invoices.view', 'finance.invoices.manage',
            'finance.budgets.view', 'finance.budgets.manage',
        ]);

        $accountant = Role::firstOrCreate(['name' => 'accountant']);
        $accountant->givePermissionTo([
            'finance.access', 'finance.view',
            'finance.invoices.view', 'finance.budgets.view',
        ]);

        // Add finance permissions to admin role
        $adminRole->givePermissionTo([
            'finance.access', 'finance.view', 'finance.manage',
            'finance.invoices.view', 'finance.invoices.manage',
            'finance.budgets.view', 'finance.budgets.manage',
        ]);
        
        // Business Development Officer - client liaison, K9 program, events
        $businessDev = Role::firstOrCreate(['name' => 'business_dev']);
        $businessDev->givePermissionTo([
            'clients.view', 'clients.create', 'clients.edit', 'clients.sites.manage',
            'k9.view',
            'reports.view',
            // Requisitions
            'requisitions.create', 'requisitions.view_own',
        ]);

        $hrPermissions = [
            'hr.employees.view', 'hr.employees.create', 'hr.employees.edit', 'hr.employees.delete',
            'hr.leaves.view', 'hr.leaves.approve', 'hr.archived.view', 'hr.resigned.view', 'hr.dismissed.view',
        ];
        $hr = Role::firstOrCreate(['name' => 'hr']);
        $hr->givePermissionTo($hrPermissions);
        $hr->givePermissionTo(['requisitions.create', 'requisitions.view_own']);

        $humanResources = Role::firstOrCreate(['name' => 'human_resources']);
        $humanResources->givePermissionTo($hrPermissions);
        $humanResources->givePermissionTo(['requisitions.create', 'requisitions.view_own']);
    }
}
