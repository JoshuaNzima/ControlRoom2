<?php

namespace App\Policies;

use App\Models\Budget;
use App\Models\User;

class BudgetPolicy
{
    /**
     * Determine whether the user can view any budgets
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(['finance.budgets.view', 'finance.*']);
    }

    /**
     * Determine whether the user can view the budget
     */
    public function view(User $user, Budget $budget): bool
    {
        return $user->hasAnyPermission(['finance.budgets.view', 'finance.*']);
    }

    /**
     * Determine whether the user can create budgets
     */
    public function create(User $user): bool
    {
        return $user->hasAnyPermission(['finance.budgets.create', 'finance.*']);
    }

    /**
     * Determine whether the user can update the budget
     */
    public function update(User $user, Budget $budget): bool
    {
        return $user->hasAnyPermission(['finance.budgets.edit', 'finance.*']);
    }

    /**
     * Determine whether the user can delete the budget
     */
    public function delete(User $user, Budget $budget): bool
    {
        return $user->hasAnyPermission(['finance.budgets.delete', 'finance.*']);
    }
}
