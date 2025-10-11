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
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create roles and assign permissions
        
        // Admin role - has all permissions
        $adminRole = Role::create(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        // Manager role - most permissions except system settings
        $managerRole = Role::create(['name' => 'manager']);
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
        ]);

        // Supervisor role - limited to attendance and viewing
        $supervisorRole = Role::create(['name' => 'supervisor']);
        $supervisorRole->givePermissionTo([
            'guards.view',
            'attendance.view', 'attendance.manage',
            'shifts.view',
            'incidents.view',
            'reports.view',
            'clients.view',
        ]);

        // Control Room Operator role - dedicated control room access
        $controlRoomRole = Role::create(['name' => 'control_room_operator']);
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
        ]);

        // Client role - very limited access
        $clientRole = Role::create(['name' => 'client']);
        $clientRole->givePermissionTo([
            'guards.view', // Only assigned guards
            'attendance.view', // Only their sites
            'reports.view', // Only their reports
        ]);
    }
}
