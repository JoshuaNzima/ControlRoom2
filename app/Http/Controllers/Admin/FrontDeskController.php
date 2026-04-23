<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use App\Models\Visitor;
use App\Models\Ticket;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FrontDeskController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $isAssistant = $user->hasRole('executive_assistant') || $user->hasRole('admin') || $user->hasRole('super_admin');

        // Get this week's date range (Monday to Sunday)
        $weekStart = now()->startOfWeek();
        $weekEnd = now()->endOfWeek();
        $today = now()->toDateString();

        // Weekly tasks breakdown
        $weeklyTasks = [
            'monday' => [],
            'tuesday' => [],
            'wednesday' => [],
            'thursday' => [],
            'friday' => [],
            'saturday' => [],
            'sunday' => [],
        ];

        // Query tasks for the week
        $weekTasksQuery = Task::with(['assignedTo', 'createdBy'])
            ->whereBetween('due_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->orWhereBetween('created_at', [$weekStart->toDateString(), $weekEnd->toDateString()]);

        if (!$isAssistant) {
            $weekTasksQuery->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id)
                  ->orWhere('created_by', $user->id);
            });
        }

        $weekTasks = $weekTasksQuery->get();

        // Group tasks by day
        foreach ($weekTasks as $task) {
            $dayName = strtolower($task->due_date ? date('l', strtotime($task->due_date)) : date('l', strtotime($task->created_at)));
            if (isset($weeklyTasks[$dayName])) {
                $weeklyTasks[$dayName][] = [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->status,
                    'priority' => $task->priority,
                    'module' => $task->module,
                    'assigned_to_name' => $task->assignedTo?->name,
                ];
            }
        }

        // Today's priority tasks
        $todayTasks = Task::with(['assignedTo'])
            ->whereDate('due_date', $today)
            ->whereIn('status', ['pending', 'in_progress'])
            ->orderBy('priority', 'desc')
            ->limit(5)
            ->get();

        // Task statistics
        $taskStats = [
            'today_pending' => Task::whereDate('due_date', $today)->whereIn('status', ['pending', 'in_progress'])->count(),
            'week_total' => $weekTasks->count(),
            'overdue' => Task::whereIn('status', ['pending', 'in_progress'])
                ->whereNotNull('due_date')
                ->where('due_date', '<', $today)
                ->count(),
            'completed_today' => Task::whereDate('completed_at', $today)->where('status', 'completed')->count(),
        ];

        // Module overview for tracking all tasks
        $moduleTasks = [];
        foreach (Task::MODULES as $key => $label) {
            $moduleTasks[$key] = [
                'label' => $label,
                'pending' => Task::where('module', $key)->whereIn('status', ['pending', 'in_progress'])->count(),
                'due_this_week' => Task::where('module', $key)
                    ->whereIn('status', ['pending', 'in_progress'])
                    ->whereBetween('due_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                    ->count(),
            ];
        }

        // Front desk specific metrics
        $frontDeskStats = [
            'open_tickets' => Ticket::where('status', 'open')->count(),
            'visitors_today' => Visitor::whereDate('created_at', $today)->count(),
            'scheduled_appointments' => 0, // Placeholder for appointment system
            'pending_followups' => Task::where('module', 'front_office')->whereIn('status', ['pending', 'in_progress'])->count(),
        ];

        // Recent visitors
        $recentVisitors = Visitor::whereDate('created_at', '>=', now()->subDays(7))
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Team members for task assignment
        $teamMembers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['executive_assistant', 'admin', 'front_desk']);
        })->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Admin/FrontDesk', [
            'weeklyTasks' => $weeklyTasks,
            'todayTasks' => $todayTasks,
            'taskStats' => $taskStats,
            'moduleTasks' => $moduleTasks,
            'frontDeskStats' => $frontDeskStats,
            'recentVisitors' => $recentVisitors,
            'teamMembers' => $teamMembers,
            'modules' => Task::MODULES,
            'priorities' => Task::PRIORITIES,
            'isAssistant' => $isAssistant,
            'auth' => [
                'user' => [
                    'id' => $user?->id,
                    'name' => $user?->name,
                    'roles' => $user?->roles ?? ['admin'],
                    'permissions' => $user?->permissions ?? [],
                ],
            ],
        ]);
    }
}
