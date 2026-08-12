<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\IncentiveType;
use App\Models\IncentiveRule;
use App\Models\IncentiveSetting;

class IncentiveDefaultsSeeder extends Seeder
{
    public function run(): void
    {
        // Create default incentive types
        $types = [
            [
                'name' => 'Perfect Attendance',
                'slug' => 'perfect-attendance',
                'description' => 'Bonus for guards with no absences or lates in the period',
                'category' => 'attendance',
                'applies_to' => 'all',
                'requires_approval' => false,
                'default_config' => json_encode(['base_amount' => 10000]),
                'sort_order' => 1,
            ],
            [
                'name' => 'Performance Bonus',
                'slug' => 'performance-bonus',
                'description' => 'Quarterly bonus based on performance evaluations',
                'category' => 'performance',
                'applies_to' => 'all',
                'requires_approval' => true,
                'default_config' => json_encode(['base_amount' => 25000]),
                'sort_order' => 2,
            ],
            [
                'name' => 'Safety Incentive',
                'slug' => 'safety-incentive',
                'description' => 'Monthly bonus for incident-free work',
                'category' => 'safety',
                'applies_to' => 'guard',
                'requires_approval' => false,
                'default_config' => json_encode(['base_amount' => 15000]),
                'sort_order' => 3,
            ],
            [
                'name' => 'Supervisor Performance',
                'slug' => 'supervisor-performance',
                'description' => 'Incentive for supervisors based on team performance',
                'category' => 'performance',
                'applies_to' => 'supervisor',
                'requires_approval' => true,
                'default_config' => json_encode(['base_amount' => 50000, 'per_guard_amount' => 2000]),
                'sort_order' => 4,
            ],
            [
                'name' => 'Tenure Recognition',
                'slug' => 'tenure-recognition',
                'description' => 'Annual bonus for employees with 5+ years of service',
                'category' => 'tenure',
                'applies_to' => 'all',
                'requires_approval' => true,
                'default_config' => json_encode(['base_amount' => 50000]),
                'sort_order' => 5,
            ],
        ];

        foreach ($types as $typeData) {
            IncentiveType::firstOrCreate(
                ['slug' => $typeData['slug']],
                array_merge($typeData, ['is_active' => true])
            );
        }

        // Create default rules for each type
        $perfectAttendance = IncentiveType::where('slug', 'perfect-attendance')->first();
        if ($perfectAttendance) {
            IncentiveRule::firstOrCreate(
                [
                    'incentive_type_id' => $perfectAttendance->id,
                    'name' => 'Monthly Perfect Attendance',
                ],
                [
                    'description' => 'Full bonus for no absences or lates in a month',
                    'condition_type' => 'perfect_attendance',
                    'condition_config' => json_encode(['period' => 'monthly']),
                    'calculation_type' => 'fixed',
                    'calculation_config' => json_encode(['amount' => 10000]),
                    'period_type' => 'monthly',
                    'is_active' => true,
                ]
            );
        }

        $safetyIncentive = IncentiveType::where('slug', 'safety-incentive')->first();
        if ($safetyIncentive) {
            IncentiveRule::firstOrCreate(
                [
                    'incentive_type_id' => $safetyIncentive->id,
                    'name' => 'Monthly Safety Bonus',
                ],
                [
                    'description' => 'Bonus for incident-free month',
                    'condition_type' => 'safety_incident_free',
                    'condition_config' => json_encode([]),
                    'calculation_type' => 'fixed',
                    'calculation_config' => json_encode(['amount' => 15000]),
                    'period_type' => 'monthly',
                    'is_active' => true,
                ]
            );
        }

        $tenureRecognition = IncentiveType::where('slug', 'tenure-recognition')->first();
        if ($tenureRecognition) {
            IncentiveRule::firstOrCreate(
                [
                    'incentive_type_id' => $tenureRecognition->id,
                    'name' => '5 Year Service Award',
                ],
                [
                    'description' => 'Annual recognition for 5+ years of service',
                    'condition_type' => 'tenure_years',
                    'condition_config' => json_encode(['min_years' => 5]),
                    'calculation_type' => 'fixed',
                    'calculation_config' => json_encode(['amount' => 50000]),
                    'period_type' => 'yearly',
                    'is_active' => true,
                ]
            );
        }

        $performanceBonus = IncentiveType::where('slug', 'performance-bonus')->first();
        if ($performanceBonus) {
            IncentiveRule::firstOrCreate(
                [
                    'incentive_type_id' => $performanceBonus->id,
                    'name' => 'Quarterly Performance Tier 1',
                ],
                [
                    'description' => 'Top performers (90%+ score)',
                    'condition_type' => 'performance_score',
                    'condition_config' => json_encode(['min_score' => 90]),
                    'calculation_type' => 'fixed',
                    'calculation_config' => json_encode(['amount' => 25000]),
                    'period_type' => 'quarterly',
                    'is_active' => true,
                ]
            );

            IncentiveRule::firstOrCreate(
                [
                    'incentive_type_id' => $performanceBonus->id,
                    'name' => 'Quarterly Performance Tier 2',
                ],
                [
                    'description' => 'Good performers (80-89% score)',
                    'condition_type' => 'performance_score',
                    'condition_config' => json_encode(['min_score' => 80, 'max_score' => 89]),
                    'calculation_type' => 'fixed',
                    'calculation_config' => json_encode(['amount' => 15000]),
                    'period_type' => 'quarterly',
                    'is_active' => true,
                ]
            );
        }

        // Create default settings
        $settings = [
            [
                'key' => 'incentives.enabled',
                'group' => 'general',
                'label' => 'Enable Incentives System',
                'description' => 'Master switch to enable/disable all incentive calculations',
                'type' => 'boolean',
                'value' => '1',
                'is_editable' => true,
                'sort_order' => 1,
            ],
            [
                'key' => 'incentives.currency',
                'group' => 'general',
                'label' => 'Currency Code',
                'description' => 'Currency code for incentive amounts (e.g., MWK, USD)',
                'type' => 'string',
                'value' => 'MWK',
                'is_editable' => true,
                'sort_order' => 2,
            ],
            [
                'key' => 'incentives.auto_approve_threshold',
                'group' => 'general',
                'label' => 'Auto-Approve Threshold',
                'description' => 'Maximum amount that can be auto-approved without manual review',
                'type' => 'number',
                'value' => '25000',
                'is_editable' => true,
                'sort_order' => 3,
            ],
            [
                'key' => 'incentives.default_calculation_day',
                'group' => 'general',
                'label' => 'Default Calculation Day',
                'description' => 'Day of month when monthly incentives are calculated (1-31)',
                'type' => 'number',
                'value' => '1',
                'is_editable' => true,
                'sort_order' => 4,
            ],
            [
                'key' => 'incentives.attendance_threshold',
                'group' => 'attendance',
                'label' => 'Attendance Threshold %',
                'description' => 'Minimum attendance percentage required for attendance-based incentives',
                'type' => 'number',
                'value' => '95',
                'is_editable' => true,
                'sort_order' => 1,
            ],
            [
                'key' => 'incentives.performance_review_required',
                'group' => 'performance',
                'label' => 'Require Performance Reviews',
                'description' => 'Whether performance incentives require completed reviews',
                'type' => 'boolean',
                'value' => '1',
                'is_editable' => true,
                'sort_order' => 1,
            ],
            [
                'key' => 'incentives.supervisor_deduction_amount',
                'group' => 'supervisor',
                'label' => 'Supervisor Incentive Deduction Amount',
                'description' => 'Amount deducted from supervisor/sergeant incentive balance per unresolved issue (MWK)',
                'type' => 'number',
                'value' => '5000',
                'is_editable' => true,
                'sort_order' => 1,
            ],
        ];

        foreach ($settings as $settingData) {
            IncentiveSetting::firstOrCreate(
                ['key' => $settingData['key']],
                $settingData
            );
        }
    }
}
