<?php

namespace Tests\Feature;

use App\Models\Guards\Attendance;
use App\Models\Guards\Client;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Guard;
use App\Models\Guards\Shift;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AutoCheckoutAttendanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_auto_checkout_closes_attendance_after_shift_end_or_12_hours(): void
    {
        $user = User::factory()->create();

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

        $guard = Guard::create([
            'employee_id' => 'G-AUTO',
            'name' => 'Auto Guard',
            'status' => 'active',
            'hire_date' => now()->subYear()->format('Y-m-d'),
            'supervisor_id' => $user->id,
        ]);

        Shift::create([
            'guard_id' => $guard->id,
            'client_site_id' => $site->id,
            'assigned_by' => $user->id,
            'date' => today()->format('Y-m-d'),
            'start_time' => '08:00:00',
            'end_time' => '16:00:00',
            'shift_type' => 'day',
            'status' => 'scheduled',
        ]);

        $attendance = Attendance::create([
            'guard_id' => $guard->id,
            'supervisor_id' => $user->id,
            'client_site_id' => $site->id,
            'date' => today()->format('Y-m-d'),
            'check_in_time' => '08:00:00',
            'check_out_time' => null,
            'status' => 'present',
        ]);

        // Simulate late day; shift end has passed
        $this->travelTo(now()->setTime(18, 0, 0));

        $this->artisan('attendance:auto-checkout --hours=12')->assertExitCode(0);

        $attendance->refresh();

        $this->assertNotNull($attendance->check_out_time, 'Attendance should be auto-checked out');
        $this->assertSame('16:00', $attendance->check_out_time->format('H:i'), 'Auto check-out should prefer shift end time');
        $this->assertSame(8.0, (float) $attendance->hours_worked);
    }

    public function test_auto_checkout_handles_overnight_shift_end_time(): void
    {
        $user = User::factory()->create();

        $client = Client::create([
            'name' => 'Test Client 2',
            'contact_person' => 'Client Contact',
            'phone' => '0123456789',
            'email' => 'client2@example.com',
            'address' => '123 Test Street',
            'status' => 'active',
        ]);

        $site = ClientSite::create([
            'client_id' => $client->id,
            'name' => 'Night Site',
            'address' => 'Site Address',
            'contact_person' => 'Site Contact',
            'phone' => '0987654321',
            'status' => 'active',
        ]);

        $guard = Guard::create([
            'employee_id' => 'G-NIGHT',
            'name' => 'Night Guard',
            'status' => 'active',
            'hire_date' => now()->subYear()->format('Y-m-d'),
            'supervisor_id' => $user->id,
        ]);

        Shift::create([
            'guard_id' => $guard->id,
            'client_site_id' => $site->id,
            'assigned_by' => $user->id,
            'date' => today()->format('Y-m-d'),
            'start_time' => '20:00:00',
            'end_time' => '06:00:00',
            'shift_type' => 'night',
            'status' => 'scheduled',
        ]);

        $attendance = Attendance::create([
            'guard_id' => $guard->id,
            'supervisor_id' => $user->id,
            'client_site_id' => $site->id,
            'date' => today()->format('Y-m-d'),
            'check_in_time' => '20:00:00',
            'check_out_time' => null,
            'status' => 'present',
        ]);

        // Move time to next day at 07:00 (past end time)
        $this->travelTo(now()->addDay()->setTime(7, 0, 0));

        $this->artisan('attendance:auto-checkout --hours=12')->assertExitCode(0);

        $attendance->refresh();

        $this->assertNotNull($attendance->check_out_time);
        $this->assertSame('06:00', $attendance->check_out_time->format('H:i'));
        $this->assertSame(8.0, (float) $attendance->hours_worked);
    }
}
