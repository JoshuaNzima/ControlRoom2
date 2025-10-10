<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class NavigationRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_navigation_routes_resolve_for_super_admin()
    {
        $super = User::factory()->create();
        if (class_exists('Spatie\\Permission\\Models\\Role')) {
            \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'super_admin']);
            $super->assignRole('super_admin');
        }

        $this->actingAs($super);

        $routes = [
            'supervisor.dashboard',
            'supervisor.guards',
            'supervisor.attendance',
            'supervisor.shifts',
            'reports.index',
            'reports.activity-logs',
            'clients.index',
            'guards.index',
            'admin.dashboard',
            'admin.users.index',
            'hr.leaves',
        ];

        foreach ($routes as $name) {
            $this->assertTrue(
                \Illuminate\Support\Facades\Route::has($name),
                "Route {$name} should be defined"
            );
        }
    }
}
