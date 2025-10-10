<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Traits\HasRoles;

class SuperAdminMiddleware
{
    
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::check() || !Role::whereHas('users', function($query) {
            $query->where('model_id', Auth::id());
        })->where('name', 'super_admin')->doesntExist()) {
            return redirect()->route('admin.dashboard')
                ->with('error', 'Access denied. Super admin privileges required.');
        }

        // Add last activity timestamp
        if ($user = Auth::user()) {
            $user->forceFill(['last_active_at' => now()])->save();
        }

        return $next($request);
    }
}