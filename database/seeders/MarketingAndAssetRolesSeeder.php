<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class MarketingAndAssetRolesSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $marketingPerms = [
            'marketing.campaigns.view',
            'marketing.campaigns.create',
            'marketing.campaigns.edit',
            'marketing.campaigns.delete',
            'marketing.leads.view',
            'marketing.leads.manage',
            'marketing.analytics.view',
            'marketing.settings.manage',
        ];

        $assetPerms = [
            'assets.settings.view',
            'assets.settings.manage',
        ];

        foreach (array_merge($marketingPerms, $assetPerms) as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $marketingOfficer = Role::firstOrCreate(['name' => 'marketing_officer']);
        $marketingOfficer->givePermissionTo($marketingPerms);

        $assetManager = Role::firstOrCreate(['name' => 'asset_manager']);
        $assetManager->givePermissionTo($assetPerms);
    }
}
