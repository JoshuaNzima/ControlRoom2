<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\Training\Trainee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $base = Trainee::query();

        $stats = [
            'total' => (clone $base)->count(),
            'in_training' => (clone $base)->where('status', 'in_training')->count(),
            'pending_review' => (clone $base)->where('status', 'pending_review')->count(),
            'approved' => (clone $base)->where('status', 'approved')->count(),
            'rejected' => (clone $base)->where('status', 'rejected')->count(),
            'rapid_response' => (clone $base)->where('training_track', 'rapid_response')->count(),
        ];

        $myPrimary = [];
        if ($user) {
            $myPrimary = Trainee::query()
                ->whereHas('trainers', function ($q) use ($user) {
                    $q->where('users.id', $user->id)
                      ->whereRaw('training_trainee_trainers.is_primary = 1');
                })
                ->latest('created_at')
                ->limit(8)
                ->get(['id', 'name', 'status', 'training_track', 'training_days', 'training_start_date', 'training_end_date']);
        }

        return Inertia::render('Training/Dashboard', [
            'stats' => $stats,
            'myPrimaryTrainees' => $myPrimary,
        ]);
    }
}
