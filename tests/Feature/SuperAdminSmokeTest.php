<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperAdminSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_access_admin_dashboard_and_clients()
    {
        $this->seed(\Database\Seeders\SuperAdminSeeder::class);

        $user = User::where('email', 'superadmin@coinsec.com')->first();
        $this->assertNotNull($user, 'Super admin user should exist after seeding');

        $response = $this->actingAs($user)->get(route('admin.dashboard'));
        $response->assertStatus(200);

        $response2 = $this->actingAs($user)->get(route('clients.index'));
        $response2->assertStatus(200);
    }
}
