<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class SuperAdminSystemTest extends TestCase
{
    use RefreshDatabase;

    protected function createSuperAdmin(): User
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $role = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->assignRole($role);
        return $user;
    }

    public function test_logs_requires_auth_redirects()
    {
        $response = $this->get(route('superadmin.logs'));
        $response->assertStatus(302);
    }

    public function test_audit_data_json_for_superadmin()
    {
        $user = $this->createSuperAdmin();
        $response = $this->actingAs($user)->get(route('superadmin.audit.data'));
        $response->assertOk();
        $response->assertJsonStructure(['entries']);
    }

    public function test_backups_list_json_for_superadmin()
    {
        $user = $this->createSuperAdmin();
        $response = $this->actingAs($user)->get(route('superadmin.backups.list'));
        $response->assertOk();
        $response->assertJsonStructure(['files']);
    }
}
