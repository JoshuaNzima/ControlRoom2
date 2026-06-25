<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Guards\Guard;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * Unified service for scoping guard queries to the authenticated user's role.
 *
 * Handles two roles that manage guards:
 *   supervisor      — User with role 'supervisor' (or 'sergeant'), guards are linked via Guard.supervisor_id
 *   zone_commander  — User with role 'zone_commander', guards scoped to the user's zone
 *
 * SERGEANT CONSOLIDATION: The 'sergeant' Spatie role has been merged into 'supervisor' for backend
 * scoping purposes. Sergeants now use the exact same Guard.supervisor_id path as supervisors.
 * The only difference is a display label ("sergeant" vs "supervisor") in the UI.
 * Client.sergeant_id (Guard FK) is eliminated — Client.supervisor_id (User FK) is the sole FK.
 *
 * Usage:
 *   $guardIds = app(GuardScopingService::class)->getManagedGuardIds($user);
 *   $guards   = app(GuardScopingService::class)->getManagedGuardQuery($user)->get();
 */
class GuardScopingService
{
    /**
     * Get the Guard IDs that the given user manages, based on their role.
     */
    public function getManagedGuardIds(?User $user = null): array
    {
        return $this->getManagedGuardQuery($user)->pluck('guards.id')->toArray();
    }

    /**
     * Get a query builder for guards managed by the given user.
     */
    public function getManagedGuardQuery(?User $user = null): Builder
    {
        $user = $user ?: Auth::user();

        if ($user->hasRole('zone_commander')) {
            return $this->forZoneCommander($user);
        }

        // Both 'supervisor' and 'sergeant' roles use the same supervisor path
        return $this->forSupervisor($user);
    }

    /**
     * Get the client IDs that the given user manages (for site/client scoping).
     */
    public function getManagedClientIds(?User $user = null): array
    {
        $user = $user ?: Auth::user();

        if ($user->hasRole('zone_commander')) {
            return Client::query()
                ->whereHas('sites.zone', fn($q) => $q->where('id', $user->zone_id))
                ->pluck('id')
                ->toArray();
        }

        // Both supervisor and sergeant use supervisor_id (User FK) as the single path
        return Client::query()
            ->where('supervisor_id', $user->id)
            ->pluck('id')
            ->toArray();
    }

    /**
     * Get the site IDs that the given user manages.
     */
    public function getManagedSiteIds(?User $user = null): array
    {
        $user = $user ?: Auth::user();
        $clientIds = $this->getManagedClientIds($user);

        if (empty($clientIds)) {
            return [];
        }

        return \App\Models\Guards\ClientSite::query()
            ->whereIn('client_id', $clientIds)
            ->pluck('id')
            ->toArray();
    }

    /**
     * Get the human-readable role type label.
     * Sergeants still display as "sergeant" in the UI for operational clarity.
     */
    public function getRoleType(?User $user = null): string
    {
        $user = $user ?: Auth::user();

        if ($user->hasRole('sergeant')) {
            return 'sergeant';
        }

        if ($user->hasRole('zone_commander')) {
            return 'zone_commander';
        }

        return 'supervisor';
    }

    /**
     * Returns whether the user is a sergeant (display label only).
     */
    public function isSergeant(?User $user = null): bool
    {
        return ($user ?: Auth::user())->hasRole('sergeant');
    }

    // -----------------------------------------------------------------------
    //  Private role-specific scoping
    // -----------------------------------------------------------------------

    /**
     * Guards managed by a supervisor (or sergeant — same path since consolidation):
     * those whose Guard.supervisor_id matches the User's id.
     */
    private function forSupervisor(User $user): Builder
    {
        return Guard::query()->where('supervisor_id', $user->id);
    }

    /**
     * Guards managed by a zone commander: those assigned to sites within the user's zone.
     */
    private function forZoneCommander(User $user): Builder
    {
        return Guard::query()
            ->whereHas('activeAssignments.clientSite.zone', function ($q) use ($user) {
                $q->where('id', $user->zone_id);
            });
    }
}
