<?php

namespace Tests\Feature;

use App\Jobs\TagScanJob;
use App\Models\Guards\Checkpoint;
use App\Models\Guards\CheckpointScan;
use App\Models\Guards\ClientSite;
use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class QRScanWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Inertia::version(fn () => 'test');

        Role::firstOrCreate(['name' => 'supervisor', 'guard_name' => 'web']);
    }

    private function inertiaVersionHeader(): array
    {
        return ['X-Inertia-Version' => 'test'];
    }

    private function makeClientSite(array $overrides = []): ClientSite
    {
        $client = Client::create([
            'name' => $overrides['client_name'] ?? 'Test Client',
            'monthly_rate' => 0,
            'status' => 'active',
        ]);

        return ClientSite::create(array_merge([
            'client_id' => $client->id,
            'name' => 'Test Site',
            'address' => '123 Test Street',
            'status' => 'active',
            'qr_code' => 'SITE-QR-' . $client->id,
            'site_type' => 'residential',
            'required_guards' => 1,
            'latitude' => 0,
            'longitude' => 0,
        ], $overrides));
    }

    private function makeCheckpoint(ClientSite $site, array $overrides = []): Checkpoint
    {
        return Checkpoint::create(array_merge([
            'client_site_id' => $site->id,
            'name' => 'Checkpoint 1',
            'code' => 'CHK-CODE-' . $site->id,
            'type' => 'qr',
            'description' => null,
            'is_active' => true,
            'requires_photo' => false,
            'scan_radius_meters' => 50,
            'latitude' => null,
            'longitude' => null,
        ], $overrides));
    }

    public function test_checkpoint_scan_invalid_code_returns_validation_error_for_inertia(): void
    {
        config(['scanner.require_gps' => false]);

        $user = User::factory()->create();
        $user->assignRole('supervisor');

        $response = $this
            ->actingAs($user)
            ->withHeader('X-Inertia', 'true')
            ->from(route('scan.scanner', absolute: false))
            ->post(route('scan.checkpoint', absolute: false), [
                'code' => 'INVALID-CODE',
            ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors('code');
    }

    public function test_checkpoint_scan_requires_gps_when_enabled(): void
    {
        config(['scanner.require_gps' => true]);

        $site = $this->makeClientSite();
        $this->makeCheckpoint($site);

        $user = User::factory()->create();
        $user->assignRole('supervisor');

        $response = $this
            ->actingAs($user)
            ->withHeader('X-Inertia', 'true')
            ->from(route('scan.scanner', absolute: false))
            ->post(route('scan.checkpoint', absolute: false), [
                'code' => 'CHK-CODE-' . $site->id,
            ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['latitude', 'longitude']);
    }

    public function test_checkpoint_scan_success_creates_scan_and_dispatches_tag_job(): void
    {
        config(['scanner.require_gps' => true]);
        Queue::fake();

        $site = $this->makeClientSite();
        $checkpoint = $this->makeCheckpoint($site);

        $user = User::factory()->create();
        $user->assignRole('supervisor');

        $response = $this
            ->actingAs($user)
            ->withHeader('X-Inertia', 'true')
            ->from(route('scan.scanner', absolute: false))
            ->post(route('scan.checkpoint', absolute: false), [
                'code' => $checkpoint->code,
                'latitude' => 0,
                'longitude' => 0,
            ]);

        $response->assertStatus(302);
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('checkpoint_scans', [
            'checkpoint_id' => $checkpoint->id,
            'supervisor_id' => $user->id,
        ]);

        $scan = CheckpointScan::where('checkpoint_id', $checkpoint->id)->where('supervisor_id', $user->id)->first();
        $this->assertNotNull($scan);

        Queue::assertPushed(TagScanJob::class, function (TagScanJob $job) use ($scan) {
            return $job->scanId === $scan->id;
        });

        $this->assertNotNull(session('active_checkpoint_scan'));
    }

    public function test_site_scan_missing_site_returns_validation_error_for_inertia(): void
    {
        config(['scanner.require_gps' => false]);

        $user = User::factory()->create();
        $user->assignRole('supervisor');

        $response = $this
            ->actingAs($user)
            ->withHeader('X-Inertia', 'true')
            ->from(route('scan.scanner', absolute: false))
            ->get(route('scan.site', absolute: false));

        $response->assertStatus(409);
        $response->assertSessionHasErrors('site');
    }

    public function test_site_scan_requires_gps_when_enabled(): void
    {
        config(['scanner.require_gps' => true]);

        $site = $this->makeClientSite([
            'qr_code' => 'SITE-QR-XYZ',
            'latitude' => 0,
            'longitude' => 0,
        ]);

        $user = User::factory()->create();
        $user->assignRole('supervisor');

        $response = $this
            ->actingAs($user)
            ->withHeader('X-Inertia', 'true')
            ->from(route('scan.scanner', absolute: false))
            ->get(route('scan.site', absolute: false) . '?site=' . $site->id);

        $response->assertStatus(409);
        $response->assertSessionHasErrors('gps');
    }

    public function test_site_scan_success_creates_scan(): void
    {
        config(['scanner.require_gps' => true]);

        $site = $this->makeClientSite([
            'qr_code' => 'SITE-QR-SUCCESS',
            'latitude' => 0,
            'longitude' => 0,
        ]);

        $user = User::factory()->create();
        $user->assignRole('supervisor');

        // Non-Inertia request returns JSON with redirect to attendance (no attendance yet today)
        $response = $this
            ->actingAs($user)
            ->from(route('scan.scanner', absolute: false))
            ->get(route('scan.site', absolute: false) . '?site=' . $site->id . '&latitude=0&longitude=0');

        $response->assertOk();
        $response->assertSessionHasNoErrors();
        $response->assertJson([
            'success' => true,
        ]);

        $payload = $response->json();
        $this->assertIsArray($payload);
        $this->assertArrayHasKey('redirect', $payload);
        $this->assertStringContainsString('/supervisor/attendance', (string) $payload['redirect']);

        $this->assertDatabaseHas('checkpoint_scans', [
            'supervisor_id' => $user->id,
            'latitude' => 0,
            'longitude' => 0,
        ]);
    }

    public function test_site_scan_with_existing_attendance_stores_session(): void
    {
        config(['scanner.require_gps' => true]);

        $site = $this->makeClientSite([
            'qr_code' => 'SITE-QR-SESSION',
            'latitude' => 0,
            'longitude' => 0,
        ]);

        $user = User::factory()->create();
        $user->assignRole('supervisor');

        // Create a guard for attendance record
        $guard = \App\Models\Guards\Guard::create([
            'user_id' => $user->id,
            'name' => 'Test Guard',
            'id_number' => 'G-TEST-001',
            'status' => 'active',
        ]);

        // Pre-create attendance for today so the scan stores session instead of redirecting
        \App\Models\Guards\Attendance::create([
            'guard_id' => $guard->id,
            'supervisor_id' => $user->id,
            'client_site_id' => $site->id,
            'date' => today(),
            'status' => 'present',
            'check_in_time' => now()->subHours(2),
        ]);

        $response = $this
            ->actingAs($user)
            ->from(route('scan.scanner', absolute: false))
            ->get(route('scan.site', absolute: false) . '?site=' . $site->id . '&latitude=0&longitude=0');

        $response->assertOk();
        $response->assertJson(['success' => true]);

        // Verify session has the expected keys including client_name and expires_at
        $scanSession = session('active_checkpoint_scan');
        $this->assertNotNull($scanSession);
        $this->assertEquals($site->id, $scanSession['site_id']);
        $this->assertArrayHasKey('client_name', $scanSession);
        $this->assertArrayHasKey('expires_at', $scanSession);
    }
}
