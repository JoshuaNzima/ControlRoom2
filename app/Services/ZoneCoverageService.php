<?php

namespace App\Services;

use App\Models\Zone;
use App\Models\Guards\ClientSite;
use App\Models\Shift as ScheduleShift;
use Illuminate\Support\Facades\Log;

class ZoneCoverageService
{
    /**
     * Recalculate required_guard_count for a single zone from its active sites.
     */
    public function recalculateZone(int $zoneId): void
    {
        $zone = Zone::find($zoneId);
        if (!$zone) {
            Log::warning("ZoneCoverageService: Zone {$zoneId} not found, skipping recalc");
            return;
        }

        try {
            $sites = ClientSite::query()
                ->where('zone_id', $zoneId)
                ->where('status', 'active')
                ->get(['id', 'required_guards']);

            $siteIds = $sites->pluck('id')->filter()->map(fn ($v) => (int) $v)->values()->all();
            $requiredBySite = $this->requiredGuardsBySiteFromScheduleShifts($siteIds);

            $sum = 0;
            foreach ($sites as $site) {
                $siteReq = (int) ($requiredBySite[$site->id] ?? 0);
                if ($siteReq <= 0) {
                    $siteReq = (int) ($site->required_guards ?? 0);
                }
                $sum += $siteReq;
            }

            Zone::whereKey($zoneId)->update(['required_guard_count' => (int) $sum]);

            Log::info("ZoneCoverageService: Zone {$zoneId} required_guard_count updated to {$sum}");
        } catch (\Throwable $e) {
            Log::error("ZoneCoverageService: Failed to recalc zone {$zoneId}: {$e->getMessage()}", [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Recalculate required_guard_count for all zones.
     */
    public function recalculateAll(): void
    {
        Zone::query()->orderBy('id')->chunkById(100, function ($zones) {
            foreach ($zones as $zone) {
                $this->recalculateZone($zone->id);
            }
        });
    }

    /**
     * Determine per-site required guard count from ScheduleShift rows
     * that target multiple sites. Distributes required_guards evenly across
     * the sites listed in the shift's `sites` JSON array.
     *
     * @param int[] $siteIds
     * @return array<int, int> keyed by site_id
     */
    public function requiredGuardsBySiteFromScheduleShifts(array $siteIds): array
    {
        $siteIds = array_values(array_unique(array_filter(array_map('intval', $siteIds))));
        if (empty($siteIds)) {
            return [];
        }

        $siteIdSet = array_fill_keys($siteIds, true);
        $requiredBySite = array_fill_keys($siteIds, 0);

        $shiftRows = ScheduleShift::query()
            ->select(['required_guards', 'sites', 'status', 'is_global'])
            ->where('is_global', false)
            ->whereNotNull('sites')
            ->whereIn('status', ['active', 'scheduled'])
            ->get();

        foreach ($shiftRows as $shift) {
            $reqTotal = (int) ($shift->required_guards ?? 0);
            if ($reqTotal <= 0) {
                continue;
            }

            $shiftSites = is_array($shift->sites) ? $shift->sites : [];
            $inScope = [];
            foreach ($shiftSites as $sid) {
                $sid = (int) $sid;
                if (isset($siteIdSet[$sid])) {
                    $inScope[$sid] = true;
                }
            }

            $scopeSiteIds = array_keys($inScope);
            $scopeCount = count($scopeSiteIds);
            if ($scopeCount <= 0) {
                continue;
            }

            sort($scopeSiteIds);
            $base = intdiv($reqTotal, $scopeCount);
            $rem = $reqTotal % $scopeCount;
            foreach ($scopeSiteIds as $i => $sid) {
                $add = $base + ($i < $rem ? 1 : 0);
                $requiredBySite[$sid] = (int) ($requiredBySite[$sid] ?? 0) + $add;
            }
        }

        return $requiredBySite;
    }
}
