<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Guards\{Client, ClientSite, Guard, Attendance};

class SupervisorAttendanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_supervisor_can_check_in_and_out()
    {
        // Create supervisor user
        $supervisor = User::factory()->create([ 'email' => 'supervisor@example.com' ]);
        // Assign supervisor role if roles exist
        if (class_exists('Spatie\\Permission\\Models\\Role')) {
            \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'supervisor']);
            $supervisor->assignRole('supervisor');

            // Ensure required permissions exist and are granted to the supervisor for testing
            if (class_exists('Spatie\\Permission\\Models\\Permission')) {
                \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'attendance.manage']);
                \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'guards.view']);
                $supervisor->givePermissionTo(['attendance.manage', 'guards.view']);
            }
        }

        // Create client and site
        $client = Client::create([
            'name' => 'Test Client',
            'contact_person' => 'Client Contact',
            'phone' => '0123456789',
            'email' => 'client@example.com',
            'address' => '123 Test Street',
            'status' => 'active',
        ]);

        $site = ClientSite::create([
            'client_id' => $client->id,
            'name' => 'Main Site',
            'address' => 'Site Address',
            'contact_person' => 'Site Contact',
            'phone' => '0987654321',
            'status' => 'active',
        ]);

        // Create a guard assigned to this supervisor
        $guard = Guard::create([
            'employee_id' => 'G001',
            'name' => 'Test Guard',
            'status' => 'active',
            'hire_date' => now()->subYear()->format('Y-m-d'),
            'supervisor_id' => $supervisor->id,
        ]);

        // Act as supervisor
        $this->actingAs($supervisor);

        // Check-in without time (should default to now)
        $response = $this->post(route('supervisor.attendance.check-in'), [
            'guard_id' => $guard->id,
            'client_site_id' => $site->id,
            // 'time' omitted
            'notes' => 'Checked in via test',
        ]);

        $response->assertStatus(302); // redirect back

        $attendance = Attendance::where('guard_id', $guard->id)->whereDate('date', now()->format('Y-m-d'))->first();
        $this->assertNotNull($attendance, 'Attendance record should be created on check-in');
        $this->assertNotNull($attendance->check_in_time, 'Check-in time should be set');

        // Now check-out (provide explicit time)
        $response2 = $this->post(route('supervisor.attendance.check-out'), [
            'guard_id' => $guard->id,
            'time' => now()->addHours(9)->format('H:i'),
            'notes' => 'Checked out via test',
        ]);

        $response2->assertStatus(302);

        $attendance->refresh();
        $this->assertNotNull($attendance->check_out_time, 'Check-out time should be set');
        $this->assertGreaterThanOrEqual(8, $attendance->hours_worked ?? 0, 'Hours worked should be at least 8 if checked out 9 hours later');
    }
}
