<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Core\Module;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            [
                'name' => 'guards',
                'display_name' => 'Guard Management',
                'description' => 'Complete guard operations management',
                'icon' => 'HiOutlineShieldCheck',
                'color' => '#059669',
                'is_active' => true,
                'is_core' => true,
                'sort_order' => 1,
                'features' => [
                    'guards' => 'Manage security personnel',
                    'attendance' => 'Mark daily attendance',
                    'assignments' => 'Current deployment status',
                    'incidents' => 'Report and track incidents',
                    'calendar' => 'Shift calendar & assignments',
                    'operations' => 'Daily activity tracking',
                    'sergeants' => 'Manage sergeants',
                    'statistics' => 'Active, Relief, On Leave tracking',
                ],
            ],
            [
                'name' => 'hr',
                'display_name' => 'Human Resources',
                'description' => 'Employee and leave management',
                'icon' => 'HiOutlineUsers',
                'color' => '#7C3AED',
                'is_active' => false,
                'is_core' => false,
                'sort_order' => 2,
                'features' => [
                    'leave_management' => 'Monitor guard leaves',
                    'archived_guards' => 'Track exited guard records',
                    'resigned' => 'Resigned employees tracking',
                    'dismissed' => 'Dismissed employees tracking',
                    'employee_records' => 'Complete HR records',
                ],
            ],
            [
                'name' => 'training',
                'display_name' => 'Training',
                'description' => 'Trainee pipeline, trainers, and training tracks',
                'icon' => 'HiOutlineAcademicCap',
                'color' => '#DC2626',
                'is_active' => true,
                'is_core' => false,
                'sort_order' => 3,
                'features' => [
                    'dashboard' => 'Training overview and progress',
                    'trainees' => 'Manage trainees and trainer assignments',
                    'regimens' => 'Manage training regimens and goals',
                ],
            ],
            [
                'name' => 'clients',
                'display_name' => 'Client Management',
                'description' => 'Client relationships and locations',
                'icon' => 'HiOutlineOfficeBuilding',
                'color' => '#0891B2',
                'is_active' => true,
                'is_core' => true,
                'sort_order' => 4,
                'features' => [
                    'clients' => 'Client locations and details',
                    'sites' => 'Client site management',
                    'contracts' => 'Contract management',
                ],
            ],
            [
                'name' => 'k9',
                'display_name' => 'K9 Unit',
                'description' => 'Trained dogs and handlers management',
                'icon' => '🐕',
                'color' => '#D97706',
                'is_active' => false,
                'is_core' => false,
                'sort_order' => 5,
                'features' => [
                    'dogs' => 'Trained dogs database',
                    'handlers' => 'K9 handler management',
                    'training' => 'Training schedules',
                    'deployments' => 'K9 assignments',
                ],
            ],
            [
                'name' => 'control_room',
                'display_name' => 'Control Room',
                'description' => 'Real-time monitoring and emergency response',
                'icon' => 'HiOutlineDesktopComputer',
                'color' => '#1D4ED8',
                'is_active' => false,
                'is_core' => false,
                'sort_order' => 6,
                'features' => [
                    'live_dashboard' => 'Real-time monitoring',
                    'incidents' => 'Incident management',
                    'alerts' => 'Emergency alerts',
                    'communications' => 'Guard communications',
                    'cctv' => 'CCTV Monitoring'
                ],
            ],
            [
                'name' => 'reports',
                'display_name' => 'Reports & Analytics',
                'description' => 'Comprehensive reporting and analytics',
                'icon' => 'HiOutlineChartBar',
                'color' => '#EA580C',
                'is_active' => true,
                'is_core' => true,
                'sort_order' => 7,
                'features' => [
                    'reports' => 'Generate operational reports',
                    'activity_logs' => 'User actions & history',
                    'analytics' => 'Data visualization',
                ],
            ],
            [
                'name' => 'admin',
                'display_name' => 'System Administration',
                'description' => 'System configuration and management',
                'icon' => 'HiOutlineCog',
                'color' => '#6B7280',
                'is_active' => true,
                'is_core' => true,
                'sort_order' => 10,
                'features' => [
                    'users' => 'User management',
                    'roles' => 'Role management',
                    'settings' => 'System settings',
                    'modules' => 'Module configuration',
                ],
            ],
        ];

        foreach ($modules as $moduleData) {
            $features = $moduleData['features'];
            unset($moduleData['features']);
            
            $module = Module::updateOrCreate(
                ['name' => $moduleData['name']],
                array_merge($moduleData, ['config' => ['features' => $features]])
            );
        }
    }
}