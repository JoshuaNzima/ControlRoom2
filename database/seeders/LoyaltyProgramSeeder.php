<?php

namespace Database\Seeders;

use App\Models\LoyaltyRule;
use App\Models\LoyaltyTier;
use App\Models\LoyaltyReward;
use Illuminate\Database\Seeder;

class LoyaltyProgramSeeder extends Seeder
{
    public function run(): void
    {
        // Loyalty Rules
        LoyaltyRule::create([
            'name' => 'Payment Rewards',
            'type' => 'payment',
            'points_per_unit' => 10,
            'unit_description' => 'per MWK 1000',
            'description' => 'Earn 10 points for every MWK 1,000 paid',
            'is_active' => true,
            'priority' => 100,
        ]);

        LoyaltyRule::create([
            'name' => 'Service Bonus',
            'type' => 'service',
            'points_per_unit' => 50,
            'unit_description' => 'per service subscription',
            'description' => 'Earn bonus points when subscribing to additional services',
            'is_active' => true,
            'priority' => 80,
        ]);

        LoyaltyRule::create([
            'name' => 'Contract Longevity',
            'type' => 'contract_length',
            'points_per_unit' => 100,
            'unit_description' => 'per year of contract',
            'description' => 'Bonus points based on contract duration',
            'is_active' => true,
            'priority' => 60,
        ]);

        LoyaltyRule::create([
            'name' => 'Referral Rewards',
            'type' => 'referral',
            'points_per_unit' => 500,
            'unit_description' => 'per successful referral',
            'description' => 'Earn points for referring new clients',
            'is_active' => true,
            'priority' => 90,
        ]);

        // Loyalty Tiers
        LoyaltyTier::create([
            'name' => 'Bronze',
            'level' => 1,
            'min_points' => 0,
            'max_points' => 999,
            'multiplier' => 1.0,
            'benefits' => ['Standard support', '5% discount on services'],
            'color' => '#CD7F32',
            'icon' => 'Award',
            'is_active' => true,
        ]);

        LoyaltyTier::create([
            'name' => 'Silver',
            'level' => 2,
            'min_points' => 1000,
            'max_points' => 4999,
            'multiplier' => 1.25,
            'benefits' => ['Priority support', '10% discount on services', 'Quarterly reviews'],
            'color' => '#C0C0C0',
            'icon' => 'Zap',
            'is_active' => true,
        ]);

        LoyaltyTier::create([
            'name' => 'Gold',
            'level' => 3,
            'min_points' => 5000,
            'max_points' => 9999,
            'multiplier' => 1.5,
            'benefits' => ['VIP support', '15% discount on services', 'Monthly reviews', 'Free upgrades'],
            'color' => '#FFD700',
            'icon' => 'Star',
            'is_active' => true,
        ]);

        LoyaltyTier::create([
            'name' => 'Platinum',
            'level' => 4,
            'min_points' => 10000,
            'max_points' => null,
            'multiplier' => 2.0,
            'benefits' => ['Dedicated account manager', '20% discount on services', 'Weekly reviews', 'Custom solutions', 'Priority billing'],
            'color' => '#E5E4E2',
            'icon' => 'Crown',
            'is_active' => true,
        ]);

        // Loyalty Rewards
        LoyaltyReward::create([
            'name' => 'MWK 5,000 Service Credit',
            'description' => 'Redeem for MWK 5,000 credit towards any service',
            'type' => 'credit',
            'points_required' => 500,
            'value' => 5000,
            'unit' => 'MWK',
            'quantity_available' => null,
            'is_limited' => false,
            'requires_approval' => false,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        LoyaltyReward::create([
            'name' => 'MWK 10,000 Service Credit',
            'description' => 'Redeem for MWK 10,000 credit towards any service',
            'type' => 'credit',
            'points_required' => 1000,
            'value' => 10000,
            'unit' => 'MWK',
            'quantity_available' => null,
            'is_limited' => false,
            'requires_approval' => false,
            'is_active' => true,
            'sort_order' => 2,
        ]);

        LoyaltyReward::create([
            'name' => '15% Discount on Next Service',
            'description' => 'Get 15% off on your next service subscription',
            'type' => 'discount',
            'points_required' => 750,
            'value' => 15,
            'unit' => '%',
            'quantity_available' => null,
            'is_limited' => false,
            'requires_approval' => false,
            'is_active' => true,
            'sort_order' => 3,
        ]);

        LoyaltyReward::create([
            'name' => 'Free Guard Training Program',
            'description' => 'Complimentary advanced guard training for your team',
            'type' => 'service',
            'points_required' => 1500,
            'value' => 50000,
            'unit' => 'MWK',
            'quantity_available' => 10,
            'is_limited' => true,
            'requires_approval' => true,
            'is_active' => true,
            'sort_order' => 4,
        ]);

        LoyaltyReward::create([
            'name' => 'Free Security Assessment',
            'description' => 'Comprehensive free security assessment of your sites',
            'type' => 'service',
            'points_required' => 1000,
            'value' => 30000,
            'unit' => 'MWK',
            'quantity_available' => 5,
            'is_limited' => true,
            'requires_approval' => true,
            'is_active' => true,
            'sort_order' => 5,
        ]);

        LoyaltyReward::create([
            'name' => '30 Days Free Service',
            'description' => 'One month of free service for one of your sites',
            'type' => 'service',
            'points_required' => 2500,
            'value' => null,
            'unit' => 'days',
            'quantity_available' => 3,
            'is_limited' => true,
            'requires_approval' => true,
            'is_active' => true,
            'sort_order' => 6,
        ]);
    }
}
