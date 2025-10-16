<?php

namespace App\Policies;

use App\Models\Guards\Guard;
use App\Models\User;

class GuardPolicy
{
    /**
     * Determine whether the user can view any guards.
     */
    public function viewAny(User $user): bool
    {
        // allow any authenticated user to see lists (further filtering happens elsewhere)
        return true;
    }

    /**
     * Determine whether the user can view the guard.
     */
    public function view(User $user, Guard $guard): bool
    {
        // zone commanders and supervisors can view guards in their zone/supervision
        if ($user->hasRole('zone_commander')) return true;
        if ($user->hasRole('supervisor') && $guard->supervisor_id === $user->id) return true;

        // fall back to allow if user has a broad permission
        return $user->hasPermissionTo('guards.view');
    }

    /**
     * Determine whether the user can create guards.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['supervisor', 'manager', 'zone_commander']) || $user->hasPermissionTo('guards.create');
    }

    /**
     * Determine whether the user can update the guard.
     */
    public function update(User $user, Guard $guard): bool
    {
        // supervisors may update guards they supervise; managers/zone commanders may update any
        if ($user->hasRole('manager') || $user->hasRole('zone_commander')) return true;
        if ($user->hasRole('supervisor') && $guard->supervisor_id === $user->id) return true;

        return false;
    }

    /**
     * Determine whether the user can delete the guard.
     */
    public function delete(User $user, Guard $guard): bool
    {
        return $user->hasAnyRole(['manager', 'zone_commander']);
    }
}
