<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Guards\Client;
use App\Models\ClientLoyaltyPoints;

class ClientLoyaltyPointsPolicy
{
    /**
     * Determine if user can view loyalty points
     */
    public function view(User $user, ClientLoyaltyPoints $loyaltyPoints): bool
    {
        // Admin and super admin always have access
        if ($user->hasAnyRole(['admin', 'super_admin', 'superadmin'])) {
            return true;
        }

        // Finance roles can view any client's loyalty
        if ($user->hasAnyRole(['finance', 'finance_officer', 'finance_manager', 'accountant'])) {
            return true;
        }

        // Clients can view their own loyalty points
        if ($user->hasRole('client')) {
            // Check if user is associated with the client
            return $user->client_id === $loyaltyPoints->client_id;
        }

        return false;
    }

    /**
     * Determine if user can view client's loyalty summary (read-only)
     */
    public function viewSummary(User $user, Client $client): bool
    {
        // Admin and super admin
        if ($user->hasAnyRole(['admin', 'super_admin', 'superadmin'])) {
            return true;
        }

        // Finance roles can view any client
        if ($user->hasAnyRole(['finance', 'finance_officer', 'finance_manager', 'accountant'])) {
            return true;
        }

        // Clients can only view their own
        if ($user->hasRole('client')) {
            return $user->client_id === $client->id;
        }

        return false;
    }

    /**
     * Determine if user can redeem rewards
     */
    public function redeem(User $user, Client $client): bool
    {
        // Only the client themselves can redeem
        if ($user->hasRole('client')) {
            return $user->client_id === $client->id;
        }

        return false;
    }

    /**
     * Determine if user can manage loyalty (admin only)
     */
    public function manage(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin', 'superadmin']);
    }

    /**
     * Determine if user can approve/reject redemptions (admin/finance)
     */
    public function approveRedemptions(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin', 'superadmin', 'finance', 'finance_officer', 'finance_manager', 'accountant']);
    }

    /**
     * Determine if user can view reports (admin/finance)
     */
    public function viewReports(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin', 'superadmin', 'finance', 'finance_officer', 'finance_manager', 'accountant']);
    }
}
