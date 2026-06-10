<?php

namespace Tests\Feature;

use App\Models\Requisition;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class RequisitionBatchSmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(Carbon::create(2026, 6, 3, 12, 0, 0));
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function test_asset_manager_can_compile_todays_batch_and_batch_pending_disbursement_requisitions(): void
    {
        $assetManagerRole = Role::firstOrCreate([
            'name' => 'asset_manager',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create();
        $user->assignRole($assetManagerRole);

        $batchedOne = Requisition::create([
            'requested_by' => $user->id,
            'title' => 'Office Chairs',
            'description' => 'Replacement chairs for reception',
            'amount' => 100.00,
            'status' => 'pending_disbursement',
        ]);

        $batchedTwo = Requisition::create([
            'requested_by' => $user->id,
            'title' => 'Printer Ink',
            'description' => 'Black toner cartridges',
            'amount' => 250.50,
            'status' => 'pending_disbursement',
        ]);

        $untouched = Requisition::create([
            'requested_by' => $user->id,
            'title' => 'Desk Lamp',
            'description' => 'For the admin desk',
            'amount' => 45.00,
            'status' => 'pending_admin',
        ]);

        $response = $this->actingAs($user)->post(route('requisitions.batches.compile_today'));

        $response->assertRedirect();

        $this->assertDatabaseHas('requisition_batches', [
            'batch_date' => Carbon::today()->startOfDay()->format('Y-m-d H:i:s'),
            'compiled_by' => $user->id,
            'status' => 'pending_ack',
            'total_amount' => 350.50,
        ]);

        $batch = \App\Models\RequisitionBatch::query()
            ->whereDate('batch_date', Carbon::today())
            ->latest('id')
            ->first();

        $this->assertNotNull($batch);
        $this->assertEquals($user->id, $batch->compiled_by);
        $this->assertEquals('pending_ack', $batch->status);
        $this->assertEquals('350.50', (string) $batch->total_amount);

        $batchedOne->refresh();
        $batchedTwo->refresh();
        $untouched->refresh();

        $this->assertEquals($batch->id, $batchedOne->batch_id);
        $this->assertNotNull($batchedOne->batched_at);
        $this->assertEquals($batch->id, $batchedTwo->batch_id);
        $this->assertNotNull($batchedTwo->batched_at);

        $this->assertNull($untouched->batch_id);
        $this->assertNull($untouched->batched_at);
    }
}
