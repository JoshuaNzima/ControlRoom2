<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get system stats
        $stats = [
            'total_users' => \App\Models\User::count(),
            'active_modules' => 12, // Could be dynamic based on module status
            'system_status' => 'operational',
            'last_backup' => now()->subHours(6)->toISOString(), // Could be from backup log
        ];

        return Inertia::render('SuperAdmin/Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar_url' => $user->avatar_path ? asset('storage/' . ltrim($user->avatar_path, '/')) : null,
                'role' => 'super_admin',
                'created_at' => $user->created_at->toISOString(),
            ],
            'stats' => $stats,
        ]);
    }
}
