<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class FrontOfficeRolesSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $roles = [
            'executive_assistant' => 'Executive Assistant',
            'receptionist' => 'Receptionist',
            'personal_assistant' => 'Personal Assistant',
        ];

        foreach ($roles as $name => $label) {
            Role::firstOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
                ['description' => $label]
            );
        }

        // Define permissions for each role
        $permissions = [
            // Visitor management (all front office roles)
            'front_office.visitors.view',
            'front_office.visitors.create',
            'front_office.visitors.check_out',
            'front_office.visitors.badge',

            // Messages (all front office roles)
            'front_office.messages.view',
            'front_office.messages.send',
            'front_office.messages.read',

            // Calendar (Executive Assistant, Personal Assistant, Admin)
            'front_office.calendar.view',
            'front_office.calendar.create',
            'front_office.calendar.edit',
            'front_office.calendar.delete',

            // Tasks (Executive Assistant, Personal Assistant)
            'front_office.tasks.view',
            'front_office.tasks.create',
            'front_office.tasks.edit',
            'front_office.tasks.complete',

            // Reports (Executive Assistant only)
            'front_office.reports.view',
            'front_office.reports.export',
            'front_office.reports.visitors',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Assign permissions to roles
        $executiveAssistant = Role::findByName('executive_assistant');
        $receptionist = Role::findByName('receptionist');
        $personalAssistant = Role::findByName('personal_assistant');

        // Executive Assistant gets all permissions
        $executiveAssistant->syncPermissions([
            'front_office.visitors.view',
            'front_office.visitors.create',
            'front_office.visitors.check_out',
            'front_office.visitors.badge',
            'front_office.messages.view',
            'front_office.messages.send',
            'front_office.messages.read',
            'front_office.calendar.view',
            'front_office.calendar.create',
            'front_office.calendar.edit',
            'front_office.calendar.delete',
            'front_office.tasks.view',
            'front_office.tasks.create',
            'front_office.tasks.edit',
            'front_office.tasks.complete',
            'front_office.reports.view',
            'front_office.reports.export',
            'front_office.reports.visitors',
        ]);

        // Receptionist gets basic permissions (visitors, messages)
        $receptionist->syncPermissions([
            'front_office.visitors.view',
            'front_office.visitors.create',
            'front_office.visitors.check_out',
            'front_office.visitors.badge',
            'front_office.messages.view',
            'front_office.messages.send',
            'front_office.messages.read',
        ]);

        // Personal Assistant gets calendar and tasks access
        $personalAssistant->syncPermissions([
            'front_office.visitors.view',
            'front_office.visitors.create',
            'front_office.visitors.check_out',
            'front_office.visitors.badge',
            'front_office.messages.view',
            'front_office.messages.send',
            'front_office.messages.read',
            'front_office.calendar.view',
            'front_office.calendar.create',
            'front_office.calendar.edit',
            'front_office.tasks.view',
            'front_office.tasks.create',
            'front_office.tasks.complete',
        ]);

        $this->command->info('Front Office roles and permissions seeded successfully!');
        $this->command->info('Roles: Executive Assistant, Receptionist, Personal Assistant');
    }
}
