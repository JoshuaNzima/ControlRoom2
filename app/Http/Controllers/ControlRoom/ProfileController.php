<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use Spatie\Activitylog\Models\Activity;
use App\Models\GuardShift;
use App\Models\Down;
use App\Models\Scan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get recent activity logs for this user using Spatie Activity model
        $recentActivity = Activity::where('causer_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'description', 'created_at'])
            ->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'action' => $activity->description,
                    'description' => $activity->description,
                    'created_at' => $activity->created_at->toISOString(),
                    'type' => 'activity',
                ];
            });

        // Get stats for today
        $today = today();
        $stats = [
            'shifts_today' => GuardShift::whereDate('shift_date', $today)->count(),
            'guards_assigned' => GuardShift::whereDate('shift_date', $today)->whereNotNull('guard_id')->count(),
            'downs_reported' => Down::whereDate('created_at', $today)->count(),
            'scans_processed' => Scan::whereDate('created_at', $today)->count(),
        ];

        return Inertia::render('ControlRoom/Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar_url' => $user->avatar_path ? asset('storage/' . ltrim($user->avatar_path, '/')) : null,
                'role' => $user->roles->first()?->name ?? 'control_room_operator',
                'created_at' => $user->created_at->toISOString(),
            ],
            'recent_activity' => $recentActivity,
            'stats' => $stats,
        ]);
    }
}
