<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Zone;
use App\Models\Guards\ClientSite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ZoneCommanderTest extends TestCase
{
	use RefreshDatabase;

	protected function setUp(): void
	{
		parent::setUp();
		// minimal permissions
		$perms = [
			'zone.view.dashboard','zone.view.clients','zone.view.sites','zone.view.guards','zone.view.supervisors','zone.patrols.scan','zone.attendance.manage','zone.downs.manage','zone.reports.view'
		];
		foreach ($perms as $p) Permission::findOrCreate($p);
		$role = Role::findOrCreate('zone_commander');
		$role->syncPermissions($perms);
	}

	public function test_login_redirects_zone_commander_to_dashboard(): void
	{
        $zone = Zone::factory()->create();
        /** @var \App\Models\User $user */
        $user = User::factory()->create(['zone_id' => $zone->id]);
        $user->assignRole('zone_commander');

        $this->actingAs($user);
		$response = $this->get('/');
		$response->assertRedirect(route('zone.dashboard'));
	}

	public function test_zone_commander_can_view_dashboard(): void
	{
        $zone = Zone::factory()->create();
        /** @var \App\Models\User $user */
        $user = User::factory()->create(['zone_id' => $zone->id]);
        $user->assignRole('zone_commander');

        $this->actingAs($user);
		$this->get(route('zone.dashboard'))->assertStatus(200);
	}
}


