<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientsCrudTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\SuperAdminSeeder::class);
        $this->user = User::where('email', 'superadmin@coinsec.com')->first();
    }

    public function test_super_admin_can_create_client()
    {
        $payload = [
            'name' => 'Test Client',
            'address' => '123 Test Lane',
            'monthly_rate' => 0,
            'status' => 'active',
        ];

        $response = $this->actingAs($this->user)->post(route('admin.clients.store'), $payload);
        $response->assertStatus(302);
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('clients', ['name' => 'Test Client']);
    }

    public function test_super_admin_can_view_client()
    {
    $client = Client::create(['name' => 'Client One', 'address' => 'Address 1']);
    $response = $this->actingAs($this->user)->get(route('admin.clients.json', $client));
        $response->assertStatus(200);
    }

    public function test_super_admin_can_edit_and_update_client()
    {
    $client = Client::create(['name' => 'Old Name', 'address' => 'Some Address']);

        $response = $this->actingAs($this->user)->get(route('admin.clients.json', $client));
        $response->assertStatus(200);

        $response2 = $this->actingAs($this->user)->put(route('admin.clients.update', $client), [
            'name' => 'New Name',
            'address' => $client->address,
            'monthly_rate' => 0,
            'status' => 'active',
        ]);

        $response2->assertStatus(302);
        $response2->assertSessionHasNoErrors();
        $this->assertDatabaseHas('clients', ['id' => $client->id, 'name' => 'New Name']);
    }

    public function test_super_admin_can_delete_client()
    {
    $client = Client::create(['name' => 'Delete Client', 'address' => 'Nowhere']);
    $response = $this->actingAs($this->user)->delete(route('admin.clients.destroy', $client));
    $response->assertStatus(302);
    $this->assertSoftDeleted('clients', ['id' => $client->id]);
    }
}
