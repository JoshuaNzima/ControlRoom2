<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class FrontOfficeRolesSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Executive Assistant permissions
            'front_office.executive.calendar.view',
            'front_office.executive.calendar.manage',
            'front_office.executive.communications.view',
            'front_office.executive.communications.manage',
            'front_office.executive.meetings.view',
            'front_office.executive.meetings.manage',
            'front_office.executive.travel.view',
            'front_office.executive.travel.manage',
            'front_office.executive.documents.view',
            'front_office.executive.documents.manage',
            'front_office.executive.petty_cash.view',
            'front_office.executive.petty_cash.manage',
            'front_office.executive.events.view',
            'front_office.executive.events.manage',
            'front_office.executive.office_admin.view',
            'front_office.executive.office_admin.manage',

            // Personal Assistant permissions
            'front_office.personal.diary.view',
            'front_office.personal.diary.manage',
            'front_office.personal.calls.view',
            'front_office.personal.calls.manage',
            'front_office.personal.travel.view',
            'front_office.personal.travel.manage',
            'front_office.personal.errands.view',
            'front_office.personal.errands.manage',
            'front_office.personal.documents.view',
            'front_office.personal.documents.manage',
            'front_office.personal.household.view',
            'front_office.personal.household.manage',
            'front_office.personal.correspondence.view',
            'front_office.personal.correspondence.manage',
            'front_office.personal.reminders.view',
            'front_office.personal.reminders.manage',
            'front_office.personal.general_admin.view',
            'front_office.personal.general_admin.manage',

            // Shared Front Office permissions
            'front_office.dashboard.view',

            // Finance integration permissions
            'finance.view',
            'finance.access',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Executive Assistant role
        $executiveAssistant = Role::firstOrCreate(['name' => 'executive_assistant']);
        $executiveAssistant->givePermissionTo([
            'front_office.dashboard.view',
            'front_office.executive.calendar.view',
            'front_office.executive.calendar.manage',
            'front_office.executive.communications.view',
            'front_office.executive.communications.manage',
            'front_office.executive.meetings.view',
            'front_office.executive.meetings.manage',
            'front_office.executive.travel.view',
            'front_office.executive.travel.manage',
            'front_office.executive.documents.view',
            'front_office.executive.documents.manage',
            'front_office.executive.petty_cash.view',
            'front_office.executive.petty_cash.manage',
            'front_office.executive.events.view',
            'front_office.executive.events.manage',
            'front_office.executive.office_admin.view',
            'front_office.executive.office_admin.manage',
            'finance.view',
            'finance.access',
            'requisitions.create',
            'requisitions.view_own',
        ]);

        // Personal Assistant role
        $personalAssistant = Role::firstOrCreate(['name' => 'personal_assistant']);
        $personalAssistant->givePermissionTo([
            'front_office.dashboard.view',
            'front_office.personal.diary.view',
            'front_office.personal.diary.manage',
            'front_office.personal.calls.view',
            'front_office.personal.calls.manage',
            'front_office.personal.travel.view',
            'front_office.personal.travel.manage',
            'front_office.personal.errands.view',
            'front_office.personal.errands.manage',
            'front_office.personal.documents.view',
            'front_office.personal.documents.manage',
            'front_office.personal.household.view',
            'front_office.personal.household.manage',
            'front_office.personal.correspondence.view',
            'front_office.personal.correspondence.manage',
            'front_office.personal.reminders.view',
            'front_office.personal.reminders.manage',
            'front_office.personal.general_admin.view',
            'front_office.personal.general_admin.manage',
            'finance.view',
            'finance.access',
            'requisitions.create',
            'requisitions.view_own',
        ]);

        // Unified Assistant role - combines Executive & Personal permissions
        $assistant = Role::firstOrCreate(['name' => 'assistant']);
        $assistant->givePermissionTo([
            'front_office.dashboard.view',
            // Executive permissions
            'front_office.executive.calendar.view',
            'front_office.executive.calendar.manage',
            'front_office.executive.communications.view',
            'front_office.executive.communications.manage',
            'front_office.executive.meetings.view',
            'front_office.executive.meetings.manage',
            'front_office.executive.travel.view',
            'front_office.executive.travel.manage',
            'front_office.executive.documents.view',
            'front_office.executive.documents.manage',
            'front_office.executive.petty_cash.view',
            'front_office.executive.petty_cash.manage',
            'front_office.executive.events.view',
            'front_office.executive.events.manage',
            'front_office.executive.office_admin.view',
            'front_office.executive.office_admin.manage',
            // Personal permissions
            'front_office.personal.diary.view',
            'front_office.personal.diary.manage',
            'front_office.personal.calls.view',
            'front_office.personal.calls.manage',
            'front_office.personal.travel.view',
            'front_office.personal.travel.manage',
            'front_office.personal.errands.view',
            'front_office.personal.errands.manage',
            'front_office.personal.documents.view',
            'front_office.personal.documents.manage',
            'front_office.personal.household.view',
            'front_office.personal.household.manage',
            'front_office.personal.correspondence.view',
            'front_office.personal.correspondence.manage',
            'front_office.personal.reminders.view',
            'front_office.personal.reminders.manage',
            'front_office.personal.general_admin.view',
            'front_office.personal.general_admin.manage',
            // Finance integration
            'finance.view',
            'finance.access',
            'requisitions.create',
            'requisitions.view_own',
        ]);

        // Legacy roles - keep for backwards compatibility
        Role::firstOrCreate(['name' => 'front_office']);
        Role::firstOrCreate(['name' => 'receptionist']);
        Role::firstOrCreate(['name' => 'client_service']);
    }
}
