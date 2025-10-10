<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Module;

class DefaultModulesSeeder extends Seeder
{
    public function run()
    {
        $modules = [
            // HR Management Modules
            [
                'display_name' => 'Employee Management',
                'category' => 'hr',
                'version' => '1.0.0',
                'is_active' => true,
                'is_core' => true,
                'description' => 'Manage employee records, contracts, and documentation',
                'icon' => 'HiOutlineUserGroup',
                'route' => 'hr.employees',
                'order' => 10,
            ],
            [
                'display_name' => 'Recruitment',
                'category' => 'hr',
                'version' => '1.0.0',
                'is_active' => true,
                'is_core' => false,
                'description' => 'Handle job postings, applications, and hiring processes',
                'icon' => 'HiOutlineUserAdd',
                'route' => 'hr.recruitment',
                'order' => 11,
            ],
            
            // Finance Modules
            [
                'display_name' => 'Payroll',
                'category' => 'finance',
                'version' => '1.0.0',
                'is_active' => true,
                'is_core' => true,
                'description' => 'Process payroll and manage employee compensation',
                'icon' => 'HiOutlineCurrencyDollar',
                'route' => 'finance.payroll',
                'order' => 20,
            ],
            [
                'display_name' => 'Expense Management',
                'category' => 'finance',
                'version' => '1.0.0',
                'is_active' => true,
                'is_core' => false,
                'description' => 'Track and manage company expenses and reimbursements',
                'icon' => 'HiOutlineReceiptTax',
                'route' => 'finance.expenses',
                'order' => 21,
            ],

            // Administration Modules
            [
                'display_name' => 'Asset Management',
                'category' => 'admin',
                'version' => '1.0.0',
                'is_active' => true,
                'is_core' => true,
                'description' => 'Track company assets and equipment',
                'icon' => 'HiOutlineDesktopComputer',
                'route' => 'admin.assets',
                'order' => 30,
            ],
            [
                'display_name' => 'Document Management',
                'category' => 'admin',
                'version' => '1.0.0',
                'is_active' => true,
                'is_core' => true,
                'description' => 'Organize and manage company documents',
                'icon' => 'HiOutlineDocument',
                'route' => 'admin.documents',
                'order' => 31,
            ],

            // Marketing Modules
            [
                'display_name' => 'Campaign Management',
                'category' => 'marketing',
                'version' => '1.0.0',
                'is_active' => true,
                'is_core' => false,
                'description' => 'Plan and execute marketing campaigns',
                'icon' => 'HiOutlineSpeakerphone',
                'route' => 'marketing.campaigns',
                'order' => 40,
            ],
            [
                'display_name' => 'Social Media',
                'category' => 'marketing',
                'version' => '1.0.0',
                'is_active' => true,
                'is_core' => false,
                'description' => 'Manage social media presence and content',
                'icon' => 'HiOutlineGlobeAlt',
                'route' => 'marketing.social',
                'order' => 41,
            ],

            // Analytics Modules
            [
                'display_name' => 'Business Intelligence',
                'category' => 'analytics',
                'version' => '1.0.0',
                'is_active' => true,
                'is_core' => false,
                'description' => 'Advanced business analytics and reporting',
                'icon' => 'HiOutlineChartBar',
                'route' => 'analytics.bi',
                'order' => 50,
            ],
            [
                'display_name' => 'Performance Metrics',
                'category' => 'analytics',
                'version' => '1.0.0',
                'is_active' => true,
                'is_core' => false,
                'description' => 'Track and analyze key performance indicators',
                'icon' => 'HiOutlineChartSquareBar',
                'route' => 'analytics.kpi',
                'order' => 51,
            ],

            // System Modules
            [
                'display_name' => 'User Management',
                'category' => 'system',
                'version' => '1.0.0',
                'is_active' => true,
                'is_core' => true,
                'description' => 'Manage system users and permissions',
                'icon' => 'HiOutlineUserCircle',
                'route' => 'admin.users',
                'order' => 1,
            ],
            [
                'display_name' => 'System Settings',
                'category' => 'system',
                'version' => '1.0.0',
                'is_active' => true,
                'is_core' => true,
                'description' => 'Configure system-wide settings',
                'icon' => 'HiOutlineCog',
                'route' => 'admin.settings',
                'order' => 2,
            ],
        ];

        foreach ($modules as $module) {
            Module::updateOrCreate(
                ['display_name' => $module['display_name']],
                $module
            );
        }
    }
}