<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Services\NavigationService;
use App\Models\Task;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $toasts = $request->session()->get('toasts', []);
        if (!is_array($toasts)) {
            $toasts = [];
        }
        $toasts = array_values(array_filter($toasts, function ($t) {
            return is_array($t) && isset($t['message']);
        }));

        $legacy = [];
        $s = $request->session()->get('success');
        $e = $request->session()->get('error');
        $i = $request->session()->get('info');
        $w = $request->session()->get('warning');
        if ($s) { $legacy[] = ['type' => 'success', 'message' => $s]; }
        if ($e) { $legacy[] = ['type' => 'error', 'message' => $e]; }
        if ($i) { $legacy[] = ['type' => 'info', 'message' => $i]; }
        if ($w) { $legacy[] = ['type' => 'warning', 'message' => $w]; }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'phone' => $request->user()->phone ?? null,
                    'employee_id' => $request->user()->employee_id,
                    'avatar_url' => method_exists($request->user(), 'getAttribute') && $request->user()->getAttribute('avatar_path')
                        ? asset('storage/' . ltrim($request->user()->getAttribute('avatar_path'), '/'))
                        : null,
                    'roles' => method_exists($request->user(), 'getRoleNames') ? $request->user()->getRoleNames()->toArray() : [],
                    'permissions' => method_exists($request->user(), 'getAllPermissions') ? $request->user()->getAllPermissions()->pluck('name')->toArray() : [],
                    'can' => [
                        'guards.view' => $request->user()->can('guards.view'),
                        'attendance.manage' => $request->user()->can('attendance.manage'),
                        'reports.view' => $request->user()->can('reports.view'),
                        'admin.users.manage' => $request->user()->can('admin.users.manage'),
                    ],
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'toasts' => array_merge($toasts, $legacy),
            'modules' => \App\Models\Core\Module::orderBy('sort_order')->get(),
            'navigation' => $request->user() ? (new NavigationService())->getNavigationForUser($request->user()) : null,
            'weeklyTasks' => fn () => $request->user() ? Task::with(['assignedTo:id,name'])
                ->where('assigned_to', $request->user()->id)
                ->whereIn('status', ['pending', 'in_progress'])
                ->where(function ($q) {
                    $q->whereNull('due_date')
                      ->orWhere('due_date', '>=', now()->startOfWeek()->toDateString())
                      ->orWhere('due_date', '<', now()->toDateString()); // Include overdue
                })
                ->orderBy('priority', 'desc')
                ->orderBy('due_date')
                ->limit(10)
                ->get() : [],
            'isExecutiveAssistant' => fn () => $request->user() ? $request->user()->hasRole('executive_assistant') : false,
            'activeAssistant' => fn () => \App\Models\AiAssistantSetting::getActiveAssistant(),
            'assistants' => fn () => \App\Models\AiAssistantSetting::getEnabledAssistants(),
            'appName' => env('APP_NAME', 'CoinSec'),
        ];
    }
}
