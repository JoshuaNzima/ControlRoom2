<?php

namespace App\Policies;

use App\Models\Approval;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ApprovalPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Approval $approval)
    {
        return $user->id === $approval->approver_id || $user->hasRole('admin');
    }

    public function create(User $user)
    {
        // Allow users with an admin/finance role to create approval assignments
        return $user->hasRole('admin') || $user->hasRole('finance_officer');
    }

    public function approve(User $user, Approval $approval)
    {
        return $user->id === $approval->approver_id || $user->hasRole('admin');
    }

    public function reject(User $user, Approval $approval)
    {
        return $user->id === $approval->approver_id || $user->hasRole('admin');
    }
}
