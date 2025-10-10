<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Guards\Guard;

class AdminStatusToggleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_toggle_guard_and_user_status()
    {
        // Create admin user and give role
        $admin = User::factory()->create(['email' => 'admin@example.com']);
        if (class_exists('Spatie\\Permission\\Models\\Role')) {
            \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin']);
            $admin->assignRole('admin');
        }

        $this->actingAs($admin);

        // Create a guard
        $guard = Guard::create([
            'employee_id' => 'G100',
            'name' => 'Toggle Guard',
            'status' => 'active',
            'hire_date' => now()->subYear()->format('Y-m-d'),
        ]);

        // Toggle guard to suspended via PUT to admin guards.update
        $response = $this->put(route('guards.update', ['guard' => $guard->id]), [
            'employee_id' => $guard->employee_id,
            'name' => $guard->name,
            'hire_date' => $guard->hire_date,
            'status' => 'suspended',
        ]);

        $response->assertStatus(302);
        $guard->refresh();
        $this->assertEquals('suspended', $guard->status);

        // Create a normal user
        $user = User::factory()->create(['email' => 'normal@example.com', 'status' => 'active']);

        // Toggle user to inactive via PUT to admin.users.update
        $response2 = $this->put(route('admin.users.update', ['user' => $user->id]), [
            'status' => 'inactive',
        ]);

        $response2->assertStatus(302);
        $user->refresh();
        $this->assertEquals('inactive', $user->status);
    }
}
