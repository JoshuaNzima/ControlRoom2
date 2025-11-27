<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class AssetManagementController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $summary = [
            'total_assets' => 0,
            'in_service_assets' => 0,
            'total_vehicles' => 0,
            'in_service_vehicles' => 0,
        ];

        return Inertia::render('Admin/AssetManagement', [
            'summary' => $summary,
            'auth' => [
                'user' => [
                    'name' => $user?->name,
                    'roles' => $user?->roles ?? ['admin'],
                    'permissions' => $user?->permissions ?? [],
                ],
            ],
        ]);
    }
}
