<?php

namespace App\Policies;

use App\Models\Flag;
use App\Models\User;

class FlagPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // All authenticated users can view flags
    }

    public function view(User $user, Flag $flag): bool
    {
        return true; // All authenticated users can view individual flags
    }

    public function create(User $user): bool
    {
        return true; // All authenticated users can create flags
    }

    public function review(User $user, Flag $flag): bool
    {
        return $user->hasAnyRole(['supervisor', 'manager']);
    }

    public function delete(User $user, Flag $flag): bool
    {
        return $user->hasRole(['supervisor', 'manager']);
    }

    public function escalate(User $user, Flag $flag): bool
    {
        return $user->hasRole(['admin', 'manager']) && $flag->status !== 'resolved';
    }

    public function resolve(User $user, Flag $flag): bool
    {
        return $user->hasRole(['admin', 'manager', 'supervisor']) && $flag->status !== 'resolved';
    }
}