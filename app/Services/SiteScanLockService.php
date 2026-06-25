<?php

namespace App\Services;

use App\Models\Guards\Checkpoint;
use App\Models\Guards\CheckpointScan;
use App\Models\SiteScanLock;
use Carbon\Carbon;

class SiteScanLockService
{
    /**
     * Get the active lock for a user, or null.
     */
    public function getActiveLock(int $userId): ?array
    {
        $lock = SiteScanLock::active()
            ->with(['clientSite.client'])
            ->where('user_id', $userId)
            ->first();

        if (!$lock) {
            return null;
        }

        return $lock->toScanData();
    }

    /**
     * Set (upsert) a lock for the user.
     */
    public function setLock(
        int $userId,
        int $clientSiteId,
        ?int $checkpointId = null,
        ?int $scanId = null,
        ?int $ttlMinutes = null
    ): SiteScanLock {
        $ttlMinutes = $ttlMinutes ?? (int) config('scanner.lock_minutes', 120);

        // Clean up expired locks for this user first
        SiteScanLock::where('user_id', $userId)
            ->where('expires_at', '<=', now())
            ->delete();

        return SiteScanLock::updateOrCreate(
            ['user_id' => $userId],
            [
                'client_site_id' => $clientSiteId,
                'checkpoint_id' => $checkpointId,
                'scan_id' => $scanId,
                'expires_at' => now()->addMinutes($ttlMinutes),
            ]
        );
    }

    /**
     * Clear (delete) the lock for a user.
     */
    public function clearLock(int $userId): void
    {
        SiteScanLock::where('user_id', $userId)->delete();
    }

    /**
     * Check if any user has an active lock on a site.
     */
    public function isSiteLocked(int $clientSiteId): bool
    {
        return SiteScanLock::active()
            ->where('client_site_id', $clientSiteId)
            ->exists();
    }

    /**
     * Get all active locks (for control-room visibility).
     */
    public function getAllActiveLocks(): array
    {
        return SiteScanLock::active()
            ->with(['user', 'clientSite.client'])
            ->get()
            ->map(fn ($lock) => [
                'user_id' => $lock->user_id,
                'user_name' => $lock->user?->name ?? 'Unknown',
                'site_id' => $lock->client_site_id,
                'site_name' => $lock->clientSite?->name ?? 'Unknown',
                'client_name' => $lock->clientSite?->client?->name ?? 'Unknown',
                'expires_at' => $lock->expires_at->toIso8601String(),
            ])
            ->toArray();
    }

    /**
     * Clean up all expired locks.
     */
    public function cleanupExpired(): int
    {
        return SiteScanLock::where('expires_at', '<=', now())->delete();
    }
}
