<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModuleController extends Controller
{
    public function index()
    {
        $modules = [
            ['name' => 'control_room', 'display_name' => 'Control Room', 'is_active' => true],
            ['name' => 'finance', 'display_name' => 'Finance', 'is_active' => true],
            ['name' => 'guards', 'display_name' => 'Guards', 'is_active' => true],
            ['name' => 'reports', 'display_name' => 'Reports', 'is_active' => true],
            ['name' => 'messaging', 'display_name' => 'Messaging', 'is_active' => true],
            ['name' => 'hr', 'display_name' => 'Human Resources', 'is_active' => true],
            ['name' => 'k9', 'display_name' => 'K9 Unit', 'is_active' => false],
            ['name' => 'zone_commander', 'display_name' => 'Zone Commander', 'is_active' => true],
            ['name' => 'supervisor', 'display_name' => 'Supervisor', 'is_active' => true],
            ['name' => 'clients', 'display_name' => 'Clients', 'is_active' => true],
            ['name' => 'marketing', 'display_name' => 'Marketing', 'is_active' => true],
            ['name' => 'business_dev', 'display_name' => 'Business Development', 'is_active' => true],
        ];

        return Inertia::render('Admin/Modules/Index', [
            'modules' => $modules,
        ]);
    }
}
