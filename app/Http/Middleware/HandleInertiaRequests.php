<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Services\NavigationService;

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
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'employee_id' => $request->user()->employee_id,
                        // Use Spatie helpers to return arrays of role names and permission names
                        'roles' => method_exists($request->user(), 'getRoleNames') ? $request->user()->getRoleNames()->toArray() : [],
                        'permissions' => method_exists($request->user(), 'getAllPermissions') ? $request->user()->getAllPermissions()->pluck('name')->toArray() : [],
                        'can' => [
                            'guards.view' => $request->user()->can('guards.view'),
                            'attendance.manage' => $request->user()->can('attendance.manage'),
                            'reports.view' => $request->user()->can('reports.view'),
                            'admin.users.manage' => $request->user()->can('admin.users.manage'),
                ]
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
            ],

            'modules' => \App\Models\Core\Module::orderBy('sort_order')->get(),
            // Provide server-generated navigation for the frontend to consume
            'navigation' => $request->user() ? (new NavigationService())->getNavigationForUser($request->user()) : null,
        ];
    }
}
