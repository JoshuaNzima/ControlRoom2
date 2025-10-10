<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class ModularPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $departments = [
            'guards' => [
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
            ],
            
            'hr' => [
                'hr.employees.view',
                'hr.employees.create',
                'hr.employees.edit',
                'hr.employees.delete',
                'hr.payroll.view',
                'hr.payroll.process',
                'hr.leaves.view',
                'hr.leaves.approve',
                'hr.performance.view',
                'hr.performance.manage',
                'hr.training.view',
                'hr.training.manage',
                'hr.reports.view',
                'hr.reports.generate',
            ],
            
            'finance' => [
                'finance.accounts.view',
                'finance.accounts.manage',
                'finance.invoices.view',
                'finance.invoices.create',
                'finance.invoices.edit',
                'finance.payments.view',
                'finance.payments.process',
                'finance.expenses.view',
                'finance.expenses.manage',
                'finance.budgets.view',
                'finance.budgets.manage',
                'finance.reports.view',
                'finance.reports.generate',
                'finance.audit.view',
            ],
            
            'control_room' => [
                'control.dashboard.view',
                'control.live_tracking.view',
                'control.alerts.view',
                'control.alerts.manage',
                'control.communications.view',
                'control.communications.manage',
                'control.incidents.view',
                'control.incidents.dispatch',
                'control.cameras.view',
                'control.cameras.control',
                'control.reports.view',
                'control.emergency.manage',
            ],
            
            'admin' => [
                'admin.system.view',
                'admin.system.manage',
                'admin.users.view',
                'admin.users.create',
                'admin.users.edit',
                'admin.users.delete',
                'admin.roles.view',
                'admin.roles.manage',
                'admin.settings.view',
                'admin.settings.manage',
                'admin.logs.view',
                'admin.backups.manage',
                'admin.modules.manage',
            ],
            
            'reports' => [
                'reports.view',
                'reports.generate',
                'reports.export',
                'reports.schedule',
                'reports.analytics',
            ],
            
            'clients' => [
                'clients.view',
                'clients.create',
                'clients.edit',
                'clients.delete',
                'clients.sites.manage',
                'clients.contracts.view',
                'clients.reports.view',
            ],
        ];

        // Create all permissions
        foreach ($departments as $department => $permissions) {
            foreach ($permissions as $permission) {
                Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
            }
        }

        // Create department-specific roles
        $this->createDepartmentRoles($departments);
        
        // Create system-wide roles
        $this->createSystemRoles();
    }

    private function createDepartmentRoles(array $departments): void
    {
        foreach ($departments as $department => $permissions) {
            // Department Head role
            $headRole = Role::firstOrCreate(['name' => "{$department}_head"]);
            $headRole->givePermissionTo($permissions);
            
            // Department Staff role (limited permissions)
            if ($department !== 'admin') {
                $staffRole = Role::firstOrCreate(['name' => "{$department}_staff"]);
                $viewPermissions = array_filter($permissions, fn($p) => str_contains($p, '.view'));
                $staffRole->givePermissionTo($viewPermissions);
            }
        }
    }

    private function createSystemRoles(): void
    {
        // Super Admin - All permissions
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin']);
        $superAdmin->givePermissionTo(Permission::all());

        // General Manager - Most departments except admin
        $generalManager = Role::firstOrCreate(['name' => 'general_manager']);
        $managerPermissions = Permission::whereNotIn('name', 
            Permission::where('name', 'like', 'admin.%')->pluck('name')->toArray()
        )->pluck('name')->toArray();
        $generalManager->givePermissionTo($managerPermissions);

        // Operations Manager - Guards, Control Room, Clients
        $opsManager = Role::firstOrCreate(['name' => 'operations_manager']);
        $opsManager->givePermissionTo([
            ...Permission::where('name', 'like', 'guards.%')->pluck('name')->toArray(),
            ...Permission::where('name', 'like', 'control.%')->pluck('name')->toArray(),
            ...Permission::where('name', 'like', 'clients.%')->pluck('name')->toArray(),
            ...Permission::where('name', 'like', 'reports.%')->pluck('name')->toArray(),
        ]);

        // Supervisor - Field operations
        $supervisor = Role::firstOrCreate(['name' => 'supervisor']);
        $supervisor->givePermissionTo([
            'guards.view',
            'attendance.view', 'attendance.manage',
            'shifts.view',
            'incidents.view', 'incidents.create',
            'reports.view',
        ]);

        // Client - Limited access
        $client = Role::firstOrCreate(['name' => 'client']);
        $client->givePermissionTo([
            'guards.view', // Only assigned
            'reports.view', // Only their reports
            'clients.reports.view',
        ]);
    }
}
