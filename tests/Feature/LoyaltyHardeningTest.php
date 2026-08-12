<?php

namespace Tests\Feature;

use App\Models\Guards\Client;
use App\Models\LoyaltyReward;
use App\Models\ClientLoyaltyRedemption;
use App\Models\ClientLoyaltyExpiration;
use App\Models\LoyaltyTier;
use App\Models\LoyaltyRule;
use App\Models\ClientLoyaltyPoints;
use App\Models\User;
use App\Services\LoyaltyPointsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoyaltyHardeningTest extends TestCase
{
    use RefreshDatabase;

    private function makeClient(): Client
    {
        $user = User::factory()->create(['email' => 'client@example.com']);
        // Ensure client row exists for the user (relation used in controllers/policies)
        $client = Client::create([
            'user_id' => $user->id,
            'name' => 'Test Client',
            'email' => 'client@example.com',
            'phone' => '000',
            'status' => 'active',
        ]);

        // Create loyalty points row
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
            'name' => 'Test Reward',
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
            'requires_approval' => false,
            'is_active' => true,
            'sort_order' => 1,
        ], $overrides));
    }

    public function test_redeem_reward_insufficient_balance_returns_null(): void
    {
        $client = $this->makeClient();

        $points = ClientLoyaltyPoints::where('client_id', $client->id)->first();
        $points->update(['available_points' => 50]);

        $reward = $this->makeReward([
            'points_required' => 100,
            'is_limited' => false,
        ]);

        $redemption = LoyaltyPointsService::redeemReward($client, $reward->id);

        $this->assertNull($redemption);
    }

    public function test_redeem_reward_limited_inventory_second_attempt_returns_null(): void
    {
        $client = $this->makeClient();

        $points = ClientLoyaltyPoints::where('client_id', $client->id)->first();
        $points->update(['available_points' => 1000]);

        $reward = $this->makeReward([
            'is_limited' => true,
            'quantity_available' => 1,
            'quantity_redeemed' => 0,
            'requires_approval' => false,
            'points_required' => 100,
        ]);

        $first = LoyaltyPointsService::redeemReward($client, $reward->id);
        $second = LoyaltyPointsService::redeemReward($client, $reward->id);

        $this->assertNotNull($first);
        $this->assertNull($second);

        $reward->refresh();
        $this->assertEquals(1, (int) $reward->quantity_redeemed);
    }

    public function test_approve_redemption_is_idempotent_and_does_not_change_state_twice(): void
    {
        $client = $this->makeClient();

        $points = ClientLoyaltyPoints::where('client_id', $client->id)->first();
        $points->update(['available_points' => 1000]);

        $reward = $this->makeReward([
            'requires_approval' => true,
            'is_limited' => false,
            'points_required' => 100,
        ]);

        $redemption = LoyaltyPointsService::redeemReward($client, $reward->id);
        $this->assertInstanceOf(ClientLoyaltyRedemption::class, $redemption);
        $this->assertEquals('pending', $redemption->status);

        $admin = User::factory()->create(['email' => 'approver@example.com']);

        $ok1 = LoyaltyPointsService::approveRedemption($redemption, (int) $admin->id);
        $ok2 = LoyaltyPointsService::approveRedemption($redemption, (int) $admin->id);

        $this->assertTrue($ok1);
        $this->assertTrue($ok2);

        $redemption->refresh();
        $this->assertEquals('completed', $redemption->status);
    }

    public function test_reject_redemption_is_idempotent_and_does_not_refund_twice(): void
    {
        $client = $this->makeClient();

        $points = ClientLoyaltyPoints::where('client_id', $client->id)->first();
        $points->update(['available_points' => 1000]);

        $reward = $this->makeReward([
            'requires_approval' => true,
            'is_limited' => false,
            'points_required' => 100,
        ]);

        $redemption = LoyaltyPointsService::redeemReward($client, $reward->id);
        $this->assertEquals('pending', $redemption->status);

        $admin = User::factory()->create(['email' => 'rejector@example.com']);

        $before = ClientLoyaltyPoints::where('client_id', $client->id)->value('available_points');

        $ok1 = LoyaltyPointsService::rejectRedemption($redemption, 'not eligible');
        $ok2 = LoyaltyPointsService::rejectRedemption($redemption, 'not eligible');

        $this->assertTrue($ok1);
        $this->assertTrue($ok2);

        $after = ClientLoyaltyPoints::where('client_id', $client->id)->value('available_points');
        $this->assertEquals($before + 100, (int) $after); // refund exactly once
        $redemption->refresh();
        $this->assertEquals('rejected', $redemption->status);
    }

    public function test_cancel_redemption_idempotent_refunds_exactly_once(): void
    {
        $client = $this->makeClient();

        $points = ClientLoyaltyPoints::where('client_id', $client->id)->first();
        $points->update(['available_points' => 1000]);

        $reward = $this->makeReward([
            'requires_approval' => true,
            'is_limited' => false,
            'points_required' => 100,
        ]);

        $redemption = LoyaltyPointsService::redeemReward($client, $reward->id);
        $this->assertEquals('pending', $redemption->status);

        $before = ClientLoyaltyPoints::where('client_id', $client->id)->value('available_points');

        $ok1 = LoyaltyPointsService::cancelRedemption($redemption, (int) $client->id);
        $ok2 = LoyaltyPointsService::cancelRedemption($redemption, (int) $client->id);

        $this->assertTrue($ok1);
        $this->assertTrue($ok2);

        $after = ClientLoyaltyPoints::where('client_id', $client->id)->value('available_points');
        $this->assertEquals($before + 100, (int) $after); // refund exactly once

        $redemption->refresh();
        $this->assertEquals('cancelled', $redemption->status);
    }

    public function test_process_pending_expirations_is_not_double_processed(): void
    {
        $client = $this->makeClient();

        $points = ClientLoyaltyPoints::where('client_id', $client->id)->first();
        $points->update(['available_points' => 500]);

        $expiration = ClientLoyaltyExpiration::create([
            'client_id' => $client->id,
            'points' => 100,
            'expires_at' => now()->subDay(),
            'processed' => false,
        ]);

        $count1 = LoyaltyPointsService::processPendingExpirations();
        $count2 = LoyaltyPointsService::processPendingExpirations();

        $this->assertEquals(1, $count1);
        $this->assertEquals(0, $count2);

        $expiration->refresh();
        $this->assertTrue((bool) $expiration->processed);

        $points->refresh();
        $this->assertEquals(400, (int) $points->available_points); // expired exactly once
    }
}
