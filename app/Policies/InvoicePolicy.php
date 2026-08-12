<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    /**
     * Determine whether the user can view any invoices
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(['finance.invoices.view', 'finance.*']);
    }

    /**
     * Determine whether the user can view the invoice
     */
    public function view(User $user, Invoice $invoice): bool
    {
        return $user->hasAnyPermission(['finance.invoices.view', 'finance.*'])
            || $user->id === $invoice->user_id;
    }

    /**
     * Determine whether the user can create invoices
     */
    public function create(User $user): bool
    {
        return $user->hasAnyPermission(['finance.invoices.create', 'finance.*']);
    }

    /**
     * Determine whether the user can update the invoice
     */
    public function update(User $user, Invoice $invoice): bool
    {
        return ($user->id === $invoice->user_id && in_array($invoice->status, ['draft', 'sent']))
            || $user->hasAnyPermission(['finance.invoices.edit', 'finance.*']);
    }

    /**
     * Determine whether the user can delete the invoice
     */
    public function delete(User $user, Invoice $invoice): bool
    {
        return ($user->id === $invoice->user_id && $invoice->status === 'draft')
            || $user->hasAnyPermission(['finance.invoices.delete', 'finance.*']);
    }
}
