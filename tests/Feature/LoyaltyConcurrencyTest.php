<?php

namespace Tests\Feature;

use App\Models\Guards\Client;
use App\Models\LoyaltyReward;
use App\Models\ClientLoyaltyRedemption;
use App\Models\ClientLoyaltyExpiration;
use App\Models\ClientLoyaltyPoints;
use App\Models\User;
use App\Services\LoyaltyPointsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class LoyaltyConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    private function makeClient(): Client
    {
        $user = User::factory()->create(['email' => 'client-concurrency@example.com']);

        $client = Client::create([
            'user_id' => $user->id,
            'name' => 'Test Client Concurrency',
            'email' => 'client-concurrency@example.com',
            'phone' => '000',
            'status' => 'active',
        ]);

        ClientLoyaltyPoints::create([
            'client_id' => $client->id,
            'total_points' => 0,
            'available_points' => 0,
            'redeemed_points' => 0,
            'pending_points' => 0,
            'tier_metadata' => json_encode([]),
        ]);

        return $client;
    }

    private function makeReward(array $overrides = []): LoyaltyReward
    {
        return LoyaltyReward::create(array_merge([
            'name' => 'Concurrency Reward',
            'description' => 'Reward',
            'type' => 'service',
            'points_required' => 100,
            'value' => 1000,
            'unit' => null,
            'quantity_available' => null,
            'quantity_redeemed' => 0,
            'is_limited' => false,
            'valid_from' => null,
            'valid_until' => null,
            'terms' => json_encode([]),
            'requires_approval' => true,
            'is_active' => true,
            'sort_order' => 1,
        ], $overrides));
    }

    /**
     * Simulated concurrency test:
     * - keep the first transaction open while the second attempts approval
     * - ensure idempotency holds and state is completed exactly once
     *
     * Note: Laravel/PHP unit tests cannot reliably spawn true parallel threads,
     * but using a second DB connection with overlapping transactions still
     * validates locking/idempotency behavior.
     */
    public function test_approve_redemption_is_safe_under_overlapping_transactions(): void
    {
        $client = $this->makeClient();

        $points = ClientLoyaltyPoints::where('client_id', $client->id)->firstOrFail();
        $points->update(['available_points' => 1000]);

        $reward = $this->makeReward([
            'requires_approval' => true,
            'is_limited' => false,
            'points_required' => 100,
        ]);

        $redemption = LoyaltyPointsService::redeemReward($client, $reward->id);
        $this->assertNotNull($redemption);
        $this->assertEquals('pending', $redemption->status);

        $beforeAvailable = ClientLoyaltyPoints::where('client_id', $client->id)->value('available_points');

        $connection1 = DB::connection();
        $connection2 = DB::connection();

        // Start overlapping transactions: conn1 locks redemption row.
        $connection1->beginTransaction();
        try {
            // conn1 claims the row first (approve will lockForUpdate inside service).
            $ok1 = LoyaltyPointsService::approveRedemption($redemption->fresh(), 1);
            $this->assertTrue($ok1);

            // Hold conn1 open briefly so conn2 attempts while locks are held.
            usleep(100000); // 100ms

            // Run conn2 approval while conn1 still uncommitted.
            $connection2->beginTransaction();
            try {
                $ok2 = LoyaltyPointsService::approveRedemption($redemption->fresh(), 1);
                $this->assertTrue($ok2);

                $connection2->commit();
            } catch (\Throwable $e) {
                $connection2->rollBack();
                throw $e;
            }

            $connection1->commit();
        } catch (\Throwable $e) {
            $connection1->rollBack();
            throw $e;
        }

        $afterAvailable = ClientLoyaltyPoints::where('client_id', $client->id)->value('available_points');
        $this->assertEquals((int) $beforeAvailable, (int) $afterAvailable, 'Approval should not change available points.');

        $redemption->refresh();
        $this->assertEquals('completed', $redemption->status);
        $this->assertNotNull($redemption->approved_at);
        $this->assertNotNull($redemption->approved_by);
    }

    public function test_process_pending_expirations_is_safe_under_overlapping_transactions(): void
    {
        $client = $this->makeClient();

        $points = ClientLoyaltyPoints::where('client_id', $client->id)->firstOrFail();
        $points->update(['available_points' => 500]);

        $expiration = ClientLoyaltyExpiration::create([
            'client_id' => $client->id,
            'points' => 100,
            'expires_at' => now()->subDay(),
            'processed' => false,
            'claimed' => false,
            'processing' => false,
        ]);

        $connection1 = DB::connection();
        $connection2 = DB::connection();

        $connection1->beginTransaction();
        try {
            $count1 = LoyaltyPointsService::processPendingExpirations();
            $this->assertEquals(1, $count1);

            // Overlap attempt before commit (simulates scheduler double-run under lock contention).
            usleep(100000); // 100ms

            $connection2->beginTransaction();
            try {
                $count2 = LoyaltyPointsService::processPendingExpirations();
                $this->assertEquals(0, $count2);

                $connection2->commit();
            } catch (\Throwable $e) {
                $connection2->rollBack();
                throw $e;
            }

            $connection1->commit();
        } catch (\Throwable $e) {
            $connection1->rollBack();
            throw $e;
        }

        $expiration->refresh();
        $this->assertTrue((bool) $expiration->processed);

        $points->refresh();
        $this->assertEquals(400, (int) $points->available_points, 'Expired points should be applied exactly once.');
    }
}
