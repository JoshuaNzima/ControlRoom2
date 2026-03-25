<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use App\Models\PettyCashEntry;
use App\Models\PettyCashBalance;
use App\Models\TaskCategory;
use App\Models\TaskTemplate;
use App\Models\TaskDependency;
use App\Models\TaskTimeEntry;
use App\Notifications\TaskAssigned;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function dashboard(Request $request): Response
    {
        $user = $request->user();
        $isExecutiveAssistant = $user->hasRole('executive_assistant') || $user->hasRole('super_admin');
        $isFrontOffice = $user->hasRole('executive_assistant') || $user->hasRole('receptionist') || $user->hasRole('personal_assistant') || $user->hasRole('admin') || $user->hasRole('super_admin');

        $query = Task::with(['assignedTo', 'createdBy', 'categories', 'dependencies'])->withCount(['comments', 'timeEntries']);

        // Executive assistant can see all tasks, others see only their own or created by them
        if (!$isExecutiveAssistant) {
            $query->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id)
                  ->orWhere('created_by', $user->id);
            });
        }

        $filter = $request->query('filter', 'active');
        $module = $request->query('module');
        $priority = $request->query('priority');
        $category = $request->query('category');
        $search = $request->query('search');

        if ($filter === 'active') {
            $query->whereIn('status', ['pending', 'in_progress']);
        } elseif ($filter === 'completed') {
            $query->where('status', 'completed');
        } elseif ($filter === 'overdue') {
            $query->whereIn('status', ['pending', 'in_progress'])
                  ->whereNotNull('due_date')
                  ->where('due_date', '<', now()->toDateString());
        }

        if ($module) {
            $query->where('module', $module);
        }

        if ($priority) {
            $query->where('priority', $priority);
        }

        if ($category) {
            $query->whereHas('categories', function ($q) use ($category) {
                $q->where('id', $category);
            });
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('metadata', 'like', "%{$search}%");
            });
        }

        $tasks = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        // Get task statistics
        $statsQuery = Task::query();
        if (!$isExecutiveAssistant) {
            $statsQuery->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id)
                  ->orWhere('created_by', $user->id);
            });
        }

        $stats = [
            'total' => (clone $statsQuery)->count(),
            'pending' => (clone $statsQuery)->where('status', 'pending')->count(),
            'in_progress' => (clone $statsQuery)->where('status', 'in_progress')->count(),
            'completed' => (clone $statsQuery)->where('status', 'completed')->count(),
            'overdue' => (clone $statsQuery)->whereIn('status', ['pending', 'in_progress'])
                ->whereNotNull('due_date')
                ->where('due_date', '<', now()->toDateString())
                ->count(),
        ];
        // Petty cash summary for executive assistant
        $pettyCash = null;
        $assigneeStats = [];
        $departmentStats = [];
        if ($isExecutiveAssistant) {
            $balance = PettyCashBalance::getCurrent();
            $monthStart = now()->startOfMonth();
            $monthEnd = now()->endOfMonth();

            $pettyCash = [
                'current_balance' => (float) $balance->current_balance,
                'total_replenished' => (float) $balance->total_replenished,
                'total_spent' => (float) $balance->total_spent,
                'monthly_expenses' => (float) PettyCashEntry::expenses()->approved()->forPeriod($monthStart, $monthEnd)->sum('amount'),
                'monthly_replenished' => (float) PettyCashEntry::replenishments()->approved()->forPeriod($monthStart, $monthEnd)->sum('amount'),
                'pending_entries' => (int) PettyCashEntry::pending()->count(),
            ];

            // Enhanced assignee stats with progress tracking
            $assigneeStats = Task::with('assignedTo')
                ->whereNotNull('assigned_to')
                ->get()
                ->groupBy('assigned_to')
                ->map(function ($tasks, $assignedTo) {
                    $userTasks = $tasks->groupBy('status');
                    return [
                        'user_id' => (int) $assignedTo,
                        'name' => optional($tasks->first()->assignedTo)->name ?? 'Unknown',
                        'total_tasks' => $tasks->count(),
                        'pending' => $userTasks->get('pending', collect())->count(),
                        'in_progress' => $userTasks->get('in_progress', collect())->count(),
                        'completed' => $userTasks->get('completed', collect())->count(),
                        'overdue' => $tasks->filter(fn($t) => $t->isOverdue())->count(),
                        'tasks' => $tasks->sortBy('priority')->take(5)->map(fn($task) => [
                            'id' => $task->id,
                            'title' => $task->title,
                            'status' => $task->status,
                            'priority' => $task->priority,
                            'due_date' => $task->due_date?->toDateString(),
                            'module' => $task->module,
                        ]),
                    ];
                })
                ->values()
                ->sortByDesc('total_tasks');

            // Department (module) stats
            $departmentStats = Task::query()
                ->selectRaw('module, status, COUNT(*) as count')
                ->groupBy('module', 'status')
                ->get()
                ->groupBy('module')
                ->map(function ($statusGroup, $module) {
                    return [
                        'module' => $module,
                        'module_name' => Task::MODULES[$module] ?? $module,
                        'total' => $statusGroup->sum('count'),
                        'pending' => $statusGroup->where('status', 'pending')->sum('count'),
                        'in_progress' => $statusGroup->where('status', 'in_progress')->sum('count'),
                        'completed' => $statusGroup->where('status', 'completed')->sum('count'),
                        'overdue' => Task::where('module', $module)
                            ->whereIn('status', ['pending', 'in_progress'])
                            ->whereNotNull('due_date')
                            ->where('due_date', '<', now()->toDateString())
                            ->count(),
                    ];
                })
                ->values()
                ->sortByDesc('total');
        }

        return Inertia::render('Tasks/Dashboard', [
            'tasks' => $tasks,
            'stats' => $stats,
            'isExecutiveAssistant' => $isExecutiveAssistant,
            'isFrontOffice' => $isFrontOffice,
            'pettyCash' => $pettyCash,
            'assigneeStats' => $assigneeStats,
            'departmentStats' => $departmentStats,
            'overdueAnalytics' => [
                'total_overdue' => Task::whereIn('status', ['pending', 'in_progress'])
                    ->whereNotNull('due_date')
                    ->where('due_date', '<', now()->toDateString())
                    ->count(),
                'overdue_by_priority' => [
                    'urgent' => Task::whereIn('status', ['pending', 'in_progress'])->where('priority', 'urgent')->whereNotNull('due_date')->where('due_date', '<', now()->toDateString())->count(),
                    'high' => Task::whereIn('status', ['pending', 'in_progress'])->where('priority', 'high')->whereNotNull('due_date')->where('due_date', '<', now()->toDateString())->count(),
                    'medium' => Task::whereIn('status', ['pending', 'in_progress'])->where('priority', 'medium')->whereNotNull('due_date')->where('due_date', '<', now()->toDateString())->count(),
                    'low' => Task::whereIn('status', ['pending', 'in_progress'])->where('priority', 'low')->whereNotNull('due_date')->where('due_date', '<', now()->toDateString())->count(),
                ],
                'overdue_by_department' => Task::whereIn('status', ['pending', 'in_progress'])
                    ->whereNotNull('due_date')
                    ->where('due_date', '<', now()->toDateString())
                    ->selectRaw('module, COUNT(*) as count')
                    ->groupBy('module')
                    ->pluck('count', 'module')
                    ->toArray(),
            ],
            'filters' => [
                'filter' => $filter,
                'module' => $module,
                'priority' => $priority,
                'category' => $category,
                'search' => $search,
            ],
            'modules' => Task::MODULES,
            'statuses' => Task::STATUSES,
            'priorities' => Task::PRIORITIES,
            'users' => $isExecutiveAssistant
                ? User::select('id', 'name')->orderBy('name')->get()
                : [],
            'taskCategories' => TaskCategory::orderBy('name')->get(),
            'taskTemplates' => TaskTemplate::with('items')->orderBy('name')->get(),
        ]);
    }

    public function myTasks(Request $request): Response
    {
        $user = $request->user();
        $isExecutiveAssistant = $user->hasRole('executive_assistant') || $user->hasRole('super_admin');

        $assignedToFilter = $request->query('assigned_to');
        $search = $request->query('search');
        $module = $request->query('module');
        $status = $request->query('status');
        $category = $request->query('category');

        $tasks = Task::with(['createdBy', 'assignedTo', 'categories', 'dependencies'])->withCount(['comments', 'timeEntries'])
            ->when($isExecutiveAssistant && $assignedToFilter, fn($q) => $q->where('assigned_to', $assignedToFilter))
            ->when($module, fn($q) => $q->where('module', $module))
            ->when($status, fn($q) => $q->where('status', $status))
            ->when(!$isExecutiveAssistant, fn($q) => $q->where('assigned_to', $user->id))
            ->when($search, fn($q) => $q->where(function ($q2) use ($search) {
                $q2->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('metadata', 'like', "%{$search}%");
            }))
            ->when($category, fn($q) => $q->whereHas('categories', fn($q2) => $q2->where('id', $category)))
            ->whereIn('status', ['pending', 'in_progress'])
            ->orderBy('priority', 'desc')
            ->orderBy('due_date')
            ->paginate(20);

        $stats = [
            'assigned' => Task::where('assigned_to', $user->id)->whereIn('status', ['pending', 'in_progress'])->count(),
            'overdue' => Task::where('assigned_to', $user->id)
                ->whereIn('status', ['pending', 'in_progress'])
                ->whereNotNull('due_date')
                ->where('due_date', '<', now()->toDateString())
                ->count(),
            'completed' => Task::where('assigned_to', $user->id)->where('status', 'completed')->count(),
        ];

        return Inertia::render('Tasks/MyTasks', [
            'tasks' => $tasks,
            'stats' => $stats,
            'pettyCash' => $isExecutiveAssistant ? (function() {
                $balance = PettyCashBalance::getCurrent();
                $monthStart = now()->startOfMonth();
                $monthEnd = now()->endOfMonth();
                return [
                    'current_balance' => (float) $balance->current_balance,
                    'total_replenished' => (float) $balance->total_replenished,
                    'total_spent' => (float) $balance->total_spent,
                    'monthly_expenses' => (float) PettyCashEntry::expenses()->approved()->forPeriod($monthStart, $monthEnd)->sum('amount'),
                    'monthly_replenished' => (float) PettyCashEntry::replenishments()->approved()->forPeriod($monthStart, $monthEnd)->sum('amount'),
                    'pending_entries' => (int) PettyCashEntry::pending()->count(),
                ];
            })() : null,
            'modules' => Task::MODULES,
            'statuses' => Task::STATUSES,
            'priorities' => Task::PRIORITIES,
            'users' => $isExecutiveAssistant ? User::select('id', 'name')->orderBy('name')->get() : [],
            'isExecutiveAssistant' => $isExecutiveAssistant,
            'filters' => [
                'assigned_to' => $assignedToFilter,
                'module' => $request->query('module'),
                'status' => $request->query('status'),
                'category' => $request->query('category'),
                'search' => $request->query('search'),
            ],
            'taskCategories' => TaskCategory::orderBy('name')->get(),
            'taskTemplates' => TaskTemplate::with('items')->orderBy('name')->get(),
        ]);
    }

    public function templates(): Response
    {
        $user = auth()->user();
        if (!$user->hasRole('executive_assistant') && !$user->hasRole('super_admin')) {
            abort(403, 'Unauthorized');
        }

        $templates = TaskTemplate::with('items')->orderBy('name')->get();

        return Inertia::render('Tasks/Templates', [
            'templates' => $templates,
        ]);
    }

    public function storeTemplate(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (!$user->hasRole('executive_assistant') && !$user->hasRole('super_admin')) {
            abort(403, 'Unauthorized');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'module' => ['nullable', 'string', 'in:' . implode(',', array_keys(Task::MODULES))],
            'priority' => ['nullable', 'string', 'in:' . implode(',', array_keys(Task::PRIORITIES))],
            'items' => ['required', 'array', 'min:1'],
            'items.*.title' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.module' => ['nullable', 'string', 'in:' . implode(',', array_keys(Task::MODULES))],
            'items.*.priority' => ['nullable', 'string', 'in:' . implode(',', array_keys(Task::PRIORITIES))],
        ]);

        $template = TaskTemplate::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'module' => $data['module'] ?? null,
            'priority' => $data['priority'] ?? 'medium',
        ]);

        foreach ($data['items'] as $item) {
            $template->items()->create([
                'title' => $item['title'],
                'description' => $item['description'] ?? null,
                'module' => $item['module'] ?? $data['module'],
                'priority' => $item['priority'] ?? $data['priority'] ?? 'medium',
            ]);
        }

        return back()->with('success', 'Template saved successfully.');
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['required', 'integer', 'exists:users,id'],
            'module' => ['required', 'string', 'in:' . implode(',', array_keys(Task::MODULES))],
            'priority' => ['required', 'string', 'in:' . implode(',', array_keys(Task::PRIORITIES))],
            'due_date' => ['nullable', 'date'],
            'time_estimate' => ['nullable', 'numeric', 'min:0'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:task_categories,id'],
            'category_id' => ['nullable', 'integer', 'exists:task_categories,id'],
            'depends_on' => ['nullable', 'array'],
            'depends_on.*' => ['integer', 'exists:tasks,id'],
            'template_id' => ['nullable', 'integer', 'exists:task_templates,id'],
        ]);

        $validated['created_by'] = $user->id;
        $validated['status'] = 'pending';

        $metadata = $validated['metadata'] ?? [];
        if (!empty($validated['time_estimate'])) {
            $metadata['time_estimate'] = (float) $validated['time_estimate'];
        }

        $task = Task::create(array_merge($validated, ['metadata' => $metadata]));

        if (!empty($validated['category_ids'])) {
            $task->categories()->sync($validated['category_ids']);
        }
        if (!empty($validated['category_id'])) {
            $task->categories()->sync([$validated['category_id']]);
        }

        if (!empty($validated['depends_on'])) {
            foreach ($validated['depends_on'] as $depId) {
                TaskDependency::firstOrCreate(['task_id' => $task->id, 'depends_on_task_id' => $depId]);
            }
        }

        if (!empty($validated['template_id'])) {
            $template = TaskTemplate::with('items')->find($validated['template_id']);
            if ($template) {
                foreach ($template->items as $item) {
                    Task::create([
                        'created_by' => $user->id,
                        'assigned_to' => $task->assigned_to,
                        'title' => $item->title,
                        'description' => $item->description,
                        'module' => $item->module ?? $task->module,
                        'priority' => $item->priority ?? $task->priority,
                        'status' => 'pending',
                    ]);
                }
            }
        }

        // Notifications for assignment
        if ($task->assigned_to !== $user->id) {
            $assignedUser = User::find($task->assigned_to);
            if ($assignedUser) {
                $assignedUser->notify(new TaskAssigned($task));
            }
        }

        // record time entry zero initially if time estimate known
        if (!empty($metadata['time_estimate'])) {
            TaskTimeEntry::create([ 'task_id' => $task->id, 'user_id' => $user->id, 'hours' => 0, 'notes' => 'Estimated ' . $metadata['time_estimate'] . 'h' ]);
        }

        return back()->with('success', 'Task created successfully.');
    }

    public function update(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();
        $isExecutiveAssistant = $user->hasRole('executive_assistant') || $user->hasRole('super_admin');

        // Only creator, assigned user, or executive assistant can update
        if (!$isExecutiveAssistant && $task->created_by !== $user->id && $task->assigned_to !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['required', 'integer', 'exists:users,id'],
            'module' => ['required', 'string', 'in:' . implode(',', array_keys(Task::MODULES))],
            'priority' => ['required', 'string', 'in:' . implode(',', array_keys(Task::PRIORITIES))],
            'status' => ['required', 'string', 'in:' . implode(',', array_keys(Task::STATUSES))],
            'due_date' => ['nullable', 'date'],
            'category_id' => ['nullable', 'integer', 'exists:task_categories,id'],
        ]);

        $task->update($validated);
        if (!empty($validated['category_id'])) {
            $task->categories()->sync([$validated['category_id']]);
        }

        return back()->with('success', 'Task updated successfully.');
    }

    public function complete(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();

        // Only assigned user or executive assistant can complete
        if ($task->assigned_to !== $user->id && !$user->hasRole('executive_assistant') && !$user->hasRole('super_admin')) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'completion_notes' => ['nullable', 'string'],
        ]);

        $task->markAsCompleted($user->id, $validated['completion_notes'] ?? null);

        return back()->with('success', 'Task marked as completed.');
    }

    public function destroy(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();
        $isExecutiveAssistant = $user->hasRole('executive_assistant') || $user->hasRole('super_admin');

        // Only creator or executive assistant can delete
        if (!$isExecutiveAssistant && $task->created_by !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $task->delete();

        return back()->with('success', 'Task deleted successfully.');
    }

    public function addComment(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();
        $request->validate(['comment' => ['required', 'string', 'max:2000']]);

        $task->comments()->create(['user_id' => $user->id, 'comment' => $request->input('comment')]);

        return back()->with('success', 'Comment added.');
    }

    public function logTime(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'hours' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string'],
        ]);

        TaskTimeEntry::create([ 'task_id' => $task->id, 'user_id' => $user->id, 'hours' => (float)$data['hours'], 'notes' => $data['notes'] ?? null ]);

        return back()->with('success', 'Time entry recorded.');
    }

    public function bulkUpdate(Request $request): RedirectResponse
    {
        $user = $request->user();
        $isExecutiveAssistant = $user->hasRole('executive_assistant') || $user->hasRole('super_admin');

        if (!$isExecutiveAssistant) {
            abort(403, 'Unauthorized');
        }

        $data = $request->validate([
            'task_ids' => ['required', 'array'],
            'task_ids.*' => ['integer', 'exists:tasks,id'],
            'status' => ['nullable', 'string', 'in:' . implode(',', array_keys(Task::STATUSES))],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:task_categories,id'],
        ]);

        $tasks = Task::whereIn('id', $data['task_ids'])->get();
        foreach ($tasks as $task) {
            if (!empty($data['status'])) {
                $task->status = $data['status'];
            }
            if (!empty($data['assigned_to'])) {
                $task->assigned_to = $data['assigned_to'];
                $assignedUser = User::find($data['assigned_to']);
                if ($assignedUser) {
                    $assignedUser->notify(new TaskAssigned($task));
                }
            }
            $task->save();
            if (!empty($data['category_ids'])) {
                $task->categories()->sync($data['category_ids']);
            }
        }

        return back()->with('success', 'Bulk update applied.');
    }
}
