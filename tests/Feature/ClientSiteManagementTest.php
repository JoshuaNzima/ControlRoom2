<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Guards\ClientSite;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ClientSiteManagementTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): User
    {
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        $user = User::factory()->create();
        $user->assignRole('admin');

        $this->actingAs($user);

        return $user;
    }

    private function makeClient(): Client
    {
        return Client::create([
            'name' => 'Test Client',
            'status' => 'active',
            'monthly_rate' => 0,
        ]);
    }

    public function test_create_site_validates_required_fields_and_values(): void
    {
        $this->actingAsAdmin();

        $client = $this->makeClient();

        $res = $this->postJson(route('admin.clients.sites.store', ['client' => $client->id], absolute: false), [
            'name' => '',
            'address' => '',
            'required_guards' => 0,
            'status' => 'paused',
        ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['name', 'address', 'required_guards', 'status']);
    }

    public function test_admin_can_create_site_with_null_zone_and_optional_site_type(): void
    {
        $this->actingAsAdmin();

        $client = $this->makeClient();

        $create = $this->postJson(route('admin.clients.sites.store', ['client' => $client->id], absolute: false), [
            'name' => 'Unzoned Site',
            'address' => 'No Zone',
            'required_guards' => 1,
            'status' => 'active',
            'zone_id' => null,
            'site_type' => null,
            'latitude' => null,
            'longitude' => null,
        ]);

        $create->assertOk();
        $create->assertJson(['success' => true]);

        $site = ClientSite::where('client_id', $client->id)->where('name', 'Unzoned Site')->first();
        $this->assertNotNull($site);
        $this->assertNull($site->zone_id);
        $this->assertNotNull($site->qr_code);
    }

    public function test_non_admin_cannot_manage_client_sites(): void
    {
        $client = $this->makeClient();

        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);

        $user = User::factory()->create();
        $this->actingAs($user);

        $res = $this->postJson(route('admin.clients.sites.store', ['client' => $client->id], absolute: false), [
            'name' => 'Blocked',
            'address' => 'Blocked',
            'required_guards' => 1,
            'status' => 'active',
        ]);

        $res->assertStatus(403);
    }

    public function test_admin_can_create_update_delete_and_restore_client_site_via_json_routes(): void
    {
        $this->actingAsAdmin();

        $client = $this->makeClient();
        $zone = Zone::factory()->create();

        $create = $this
            ->postJson(route('admin.clients.sites.store', ['client' => $client->id], absolute: false), [
                'name' => 'HQ Site',
                'address' => '123 Main',
                'contact_person' => 'John',
                'phone' => '123',
                'latitude' => 0,
                'longitude' => 0,
                'special_instructions' => 'Gate A',
                'required_guards' => 2,
                'services_requested' => 'Patrol',
                'status' => 'active',
                'zone_id' => $zone->id,
                'site_type' => 'office',
            ]);

        $create->assertOk();
        $create->assertJson(['success' => true]);

        /** @var ClientSite $site */
        $site = ClientSite::where('client_id', $client->id)->where('name', 'HQ Site')->first();
        $this->assertNotNull($site);
        $this->assertNotNull($site->qr_code);
        $this->assertSame('office', $site->site_type);

        $show = $this->getJson(route('admin.clients.sites.show-json', ['client' => $client->id, 'site' => $site->id], absolute: false));
        $show->assertOk();
        $show->assertJsonFragment(['id' => $site->id, 'name' => 'HQ Site']);

        $update = $this
            ->putJson(route('admin.clients.sites.update', ['client' => $client->id, 'site' => $site->id], absolute: false), [
                'name' => 'HQ Site Updated',
                'address' => '123 Main',
                'contact_person' => 'Jane',
                'phone' => '456',
                'latitude' => 0,
                'longitude' => 0,
                'special_instructions' => 'Gate B',
                'required_guards' => 3,
                'services_requested' => 'Patrol',
                'status' => 'active',
                'zone_id' => $zone->id,
                'site_type' => 'residential',
            ]);

        $update->assertOk();
        $update->assertJson(['success' => true]);

        $site->refresh();
        $this->assertSame('HQ Site Updated', $site->name);
        $this->assertSame('residential', $site->site_type);

        $delete = $this->deleteJson(route('admin.clients.sites.destroy', ['client' => $client->id, 'site' => $site->id], absolute: false));
        $delete->assertOk();
        $delete->assertJson(['success' => true]);

        $this->assertSoftDeleted('client_sites', ['id' => $site->id]);

        $deletedJson = $this->getJson(route('admin.clients.sites.deleted-json', ['client' => $client->id], absolute: false));
        $deletedJson->assertOk();
        $deletedJson->assertJsonFragment(['id' => $site->id]);

        $restore = $this->postJson(route('admin.clients.sites.restore', ['client' => $client->id, 'site' => $site->id], absolute: false));
        $restore->assertOk();
        $restore->assertJson(['success' => true]);

        $site->refresh();
        $this->assertNull($site->deleted_at);
    }
}
