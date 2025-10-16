<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Zone;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Checkpoint;
use App\Models\Guards\Guard;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class ZoneCommanderDemoSeeder extends Seeder
{
	public function run(): void
	{
		// Permissions
		$perms = [
			'zone.view.dashboard',
			'zone.view.clients',
			'zone.view.sites',
			'zone.view.guards',
			'zone.view.supervisors',
			'zone.patrols.scan',
			'zone.attendance.manage',
			'zone.downs.manage',
			'zone.reports.view',
		];
		foreach ($perms as $p) {
			Permission::findOrCreate($p);
		}

		$role = Role::findOrCreate('zone_commander');
		$role->syncPermissions($perms);

		// Zone and related demo data
		$zone = Zone::firstOrCreate(['code' => 'ZN-001'], [
			'name' => 'Central Zone',
		]);

        // Create a few demo sites and checkpoints without relying on factories
        $sites = [];
        for ($i = 1; $i <= 2; $i++) {
            $site = ClientSite::create([
                'client_id' => 1,
                'name' => "Demo Site {$i}",
                'address' => 'N/A',
                'status' => 'active',
            ]);
            // attach zone id if present on table
            $site->zone_id = $zone->id;
            $site->save();
            $sites[] = $site;

            for ($j = 1; $j <= 2; $j++) {
                Checkpoint::create([
                    'client_site_id' => $site->id,
                    'name' => "Gate {$j}",
                    'type' => 'qr',
                    'is_active' => true,
                ]);
            }
        }

		// Minimal demo guards (ensure hire_date provided to satisfy NOT NULL constraints)
		for ($g = 1; $g <= 4; $g++) {
			Guard::create([
				'name' => "Guard {$g}",
				'employee_id' => "EMP{$g}",
				'phone' => '0700000000',
				'status' => 'active',
				'hire_date' => now()->subYears(1),
			]);
		}

		// Demo user
		$user = User::firstOrCreate([
			'email' => 'zone@example.com'
		], [
			'name' => 'Zone Commander',
			'password' => bcrypt('password'),
			'zone_id' => $zone->id,
		]);
		$user->assignRole($role);
	}
}


