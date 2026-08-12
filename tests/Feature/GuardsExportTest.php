<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class GuardsExportTest extends TestCase
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

    public function test_export_csv_header_contains_expected_columns()
    {
        $user = $this->createSuperAdmin();
        $response = $this->actingAs($user)->get(route('control-room.guards.export'));
        $response->assertOk();
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('Content-Type'));
        $csv = $response->streamedContent();
        $firstLine = strtok($csv, "\n");
        $this->assertStringContainsString('ID Number', $firstLine);
        $this->assertStringContainsString('Client', $firstLine);
        $this->assertStringContainsString('Site', $firstLine);
        $this->assertStringNotContainsString('Zone', $firstLine);
        $this->assertStringNotContainsString('On Duty', $firstLine);
    }
}
