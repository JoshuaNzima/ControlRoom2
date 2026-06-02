<?php

namespace Tests\Feature;

use App\Models\LoyaltyRule;
use App\Models\Guards\Client;
use App\Models\User;
use App\Services\LoyaltyPointsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoyaltyRulesParsingTest extends TestCase
{
    use RefreshDatabase;

    public function test_calculate_payment_points_uses_structured_unit_amount_only(): void
    {
        $rule = LoyaltyRule::create([
            'name' => 'Payment test rule',
            'type' => 'payment',
            'points_per_unit' => 2,
            'unit_description' => 'MWK per month 999 (legacy free-text)',
            'description' => 'desc',
            'is_active' => true,
            'priority' => 1,
            'conditions' => [
                'unit_amount' => 1000,
            ],
        ]);

        // amount / unit_amount * points_per_unit => 5000/1000 * 2 = 10
        $points = LoyaltyPointsService::calculatePaymentPoints(5000);

        $this->assertSame(10.0, $points);
    }
}
