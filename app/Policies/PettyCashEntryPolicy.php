<?php

namespace App\Policies;

use App\Models\PettyCashEntry;
use App\Models\User;

class PettyCashEntryPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // All authenticated users can view
    }

    public function view(User $user, PettyCashEntry $entry): bool
    {
        return true; // All authenticated users can view individual entries
    }

    public function create(User $user): bool
    {
        return true; // All authenticated users can create entries
    }

    public function update(User $user, PettyCashEntry $entry): bool
    {
        // Only the creator or finance/admin users can update pending entries
        if ($entry->status !== 'pending') {
            return false;
        }
        
        return $entry->user_id === $user->id || 
               $user->hasAnyRole(['admin', 'super_admin', 'finance_officer', 'accountant']);
    }

    public function delete(User $user, PettyCashEntry $entry): bool
    {
        // Only the creator or finance/admin users can delete pending entries
        if ($entry->status !== 'pending') {
            return false;
        }
        
        return $entry->user_id === $user->id || 
               $user->hasAnyRole(['admin', 'super_admin', 'finance_officer', 'accountant']);
    }

    public function approve(User $user, PettyCashEntry $entry): bool
    {
        // Only finance/admin users can approve
        return $user->hasAnyRole(['admin', 'super_admin', 'finance_officer', 'accountant']) ||
               $user->hasAnyPermission(['approve_expense', 'manage_expense', 'finance.approvals']);
    }

    public function restore(User $user, PettyCashEntry $entry): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']);
    }

    public function forceDelete(User $user, PettyCashEntry $entry): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']);
    }
}
