<?php

namespace App\Policies;

use App\Models\Expense;
use App\Models\User;

class ExpensePolicy
{
    /**
     * Determine whether the user can view any expenses
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(['finance.expenses.view', 'finance.*']);
    }

    /**
     * Determine whether the user can view the expense
     */
    public function view(User $user, Expense $expense): bool
    {
        return $user->hasAnyPermission(['finance.expenses.view', 'finance.*'])
            || $user->id === $expense->user_id;
    }

    /**
     * Determine whether the user can create expenses
     */
    public function create(User $user): bool
    {
        return $user->hasAnyPermission(['finance.expenses.manage', 'finance.*']);
    }

    /**
     * Determine whether the user can update the expense
     */
    public function update(User $user, Expense $expense): bool
    {
        return ($user->id === $expense->user_id && $expense->status === 'pending')
            || $user->hasAnyPermission(['finance.expenses.manage', 'finance.*']);
    }

    /**
     * Determine whether the user can delete the expense
     */
    public function delete(User $user, Expense $expense): bool
    {
        return $user->hasAnyPermission(['finance.expenses.manage', 'finance.*'])
            || ($user->id === $expense->user_id && $expense->status === 'pending');
    }

    /**
     * Determine whether the user can approve expenses
     */
    public function approve(User $user, Expense $expense): bool
    {
        if ($expense->status !== 'pending') {
            return false;
        }
        // Stage: admin_pending -> admins (and finance roles) can approve
        if (($expense->approval_stage ?? 'admin_pending') === 'admin_pending') {
            return $user->hasAnyRole(['admin','super_admin','finance_officer','accountant']) || $user->hasAnyPermission(['finance.expenses.manage','finance.*']);
        }
        // Stage: asset_pending -> asset managers (and super_admin) can approve
        if (($expense->approval_stage ?? '') === 'asset_pending') {
            return $user->hasAnyRole(['asset_manager','super_admin']);
        }
        return false;
    }

    /**
     * Determine whether the user can reject expenses
     */
    public function reject(User $user, Expense $expense): bool
    {
        if ($expense->status !== 'pending') {
            return false;
        }
        if (($expense->approval_stage ?? 'admin_pending') === 'admin_pending') {
            return $user->hasAnyRole(['admin','super_admin','finance_officer','accountant']) || $user->hasAnyPermission(['finance.expenses.manage','finance.*']);
        }
        if (($expense->approval_stage ?? '') === 'asset_pending') {
            return $user->hasAnyRole(['asset_manager','super_admin']);
        }
        return false;
    }

    /**
     * Determine whether the user can manage the expense (approve/reject)
     */
    public function manage(User $user, Expense $expense): bool
    {
        return $user->hasAnyPermission(['finance.expenses.manage', 'finance.*']);
    }

    /**
     * Allow requester to resubmit a rejected expense
     */
    public function resubmit(User $user, Expense $expense): bool
    {
        return $expense->status === 'rejected' && $expense->user_id === $user->id;
    }
}
