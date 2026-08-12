<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\Training\Trainee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Build stats with error handling
        $stats = $this->buildStats();

        // Get primary trainees for the current trainer
        $myPrimary = $this->getMyPrimaryTrainees($user);

        // Recent activity: latest trainees across all statuses (for activity feed)
        $recentActivity = $this->getRecentActivity();

        return Inertia::render('Training/Dashboard', [
            'stats' => $stats,
            'myPrimaryTrainees' => $myPrimary,
            'recentActivity' => $recentActivity,
        ]);
    }

    private function buildStats(): array
    {
        try {
            $base = Trainee::query();

            return [
                'total' => (clone $base)->count(),
                'in_training' => (clone $base)->where('status', 'in_training')->count(),
                'pending_review' => (clone $base)->where('status', 'pending_review')->count(),
                'approved' => (clone $base)->where('status', 'approved')->count(),
                'rejected' => (clone $base)->where('status', 'rejected')->count(),
                'rapid_response' => (clone $base)->where('training_track', 'rapid_response')->count(),
                'pending_assignment' => (clone $base)->where('status', 'pending_assignment')->count(),
            ];
        } catch (\Throwable $e) {
            Log::error('Training dashboard stats failed: ' . $e->getMessage());
            return [
                'total' => 0,
                'in_training' => 0,
                'pending_review' => 0,
                'approved' => 0,
                'rejected' => 0,
                'rapid_response' => 0,
                'pending_assignment' => 0,
            ];
        }
    }

    private function getMyPrimaryTrainees($user): array
    {
        if (!$user) {
            return [];
        }

        try {
            return Trainee::query()
                ->whereHas('trainers', function ($q) use ($user) {
                    $q->where('users.id', $user->id)
                      ->where('training_trainee_trainers.is_primary', true);
                })
                ->latest('created_at')
                ->limit(10)
                ->get(['id', 'name', 'status', 'training_track', 'training_days', 'training_start_date', 'training_end_date'])
                ->toArray();
        } catch (\Throwable $e) {
            Log::warning('Failed to load primary trainees: ' . $e->getMessage());
            return [];
        }
    }

    private function getRecentActivity(): array
    {
        try {
            return Trainee::query()
                ->whereIn('status', ['in_training', 'pending_review', 'approved', 'rejected'])
                ->latest('updated_at')
                ->limit(5)
                ->get(['id', 'name', 'status', 'training_track', 'updated_at'])
                ->map(fn ($t) => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'status' => $t->status,
                    'training_track' => $t->training_track,
                    'updated_at' => $t->updated_at?->toIso8601String(),
                ])
                ->toArray();
        } catch (\Throwable $e) {
            Log::warning('Failed to load recent training activity: ' . $e->getMessage());
            return [];
        }
    }
}
