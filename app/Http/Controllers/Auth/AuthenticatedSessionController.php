<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = $request->user();
        $dashboardRoute = $this->getDashboardRoute($user);

        return redirect()->intended($dashboardRoute);
    }

    /**
     * Get the appropriate dashboard route based on user's role
     */
    /**
     * Get the appropriate dashboard route based on user's role
     * Roles are checked in order of priority (most specific to least specific)
     */
    protected function getDashboardRoute($user): string
    {
        // Super Admin - Highest level access
        if ($user->hasRole('super_admin')) {
            return route('superadmin.dashboard', absolute: false);
        }
        
        // Admin - System administrators
        if ($user->hasRole('admin')) {
            return route('admin.dashboard', absolute: false);
        }
        
        // Zone Commander - Manages specific zones
        if ($user->hasRole('zone_commander')) {
            return route('zone.dashboard', absolute: false);
        }
        
        // Manager - Manages teams and operations
        if ($user->hasRole('manager')) {
            return route('manager.dashboard', absolute: false);
        }
        
        // Supervisor - Oversees operations and personnel
        if ($user->hasRole('supervisor')) {
            return route('supervisor.dashboard', absolute: false);
        }

        // Control Room Operator - Manages control room operations
        if ($user->hasRole('control_room_operator')) {
            return route('control-room.dashboard', absolute: false);
        }
        
        // Client - External client access
        if ($user->hasRole('client')) {
            return route('client.dashboard', absolute: false);
        }
        
        // HR - Human Resources
        if ($user->hasRole('hr') || $user->hasRole('human_resources')) {
            return route('hr.dashboard', absolute: false);
        }
        
        // Finance - Financial department
        if (
            $user->hasRole('finance') ||
            $user->hasRole('finance_officer') ||
            $user->hasRole('accountant') ||
            $user->hasRole('accounting')
        ) {
            return route('finance.dashboard', absolute: false);
        }
        
        // Sergeant - Mid-level supervisor
        if ($user->hasRole('sergeant')) {
            return route('sergeant.dashboard', absolute: false);
        }
        
        // Default dashboard for any other roles or unassigned users
        return route('dashboard', absolute: false);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
