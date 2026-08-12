<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!auth()->check()) {
            return redirect()->route('login');
        }

        $user = auth()->user();

        if ($user && method_exists($user, 'hasRole') && $user->hasRole('super_admin')) {
            return $next($request);
        }

        $expanded = [];
        foreach ($roles as $role) {
            foreach (preg_split('/[\|,]/', (string) $role) as $r) {
                $r = trim((string) $r);
                if ($r !== '') {
                    $expanded[] = $r;
                }
            }
        }

        foreach ($expanded as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        abort(403, 'Unauthorized. You do not have permission to access this page');
    }
}
