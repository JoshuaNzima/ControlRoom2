<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SystemHealthService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index(SystemHealthService $systemHealthService)
    {
        $user = auth()->user();

        $system = [
            'database_status' => $systemHealthService->getDatabaseStatus(),
            'database_size' => $systemHealthService->getDatabaseSize(),
            'cache_size' => $systemHealthService->getCacheSize(),
            'storage_free' => $systemHealthService->getStorageFree(),
            'memory_usage' => $systemHealthService->getMemoryUsage(),
            'uptime' => $systemHealthService->getUptime(),
        ];

        return Inertia::render('Admin/Settings/Index', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                ],
            ],
            'system' => $system,
        ]);
    }
}
