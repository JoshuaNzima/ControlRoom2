<?php

namespace App\Services;

use App\Models\Guards\Guard;
use App\Models\Guards\Shift as GuardShift;
use App\Models\GuardRotaException;
use App\Models\WeeklyRosterPlan;
use App\Models\WeeklyRosterPlanEntry;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Handles publishing weekly roster plans into scheduled shifts and rota exceptions.
 *
 * Previously inlined in RosterController::publishWeeklyPlan (~100 lines of exception
 * reconciliation logic). Extracted here for testability and clarity.
 */
class WeeklyPlanPublisherService
{
    public function __construct(
        private readonly RotaResolver $resolver,
    ) {}

    /**
     * Publish a weekly plan: create shifts, reconcile exceptions, and lock the plan.
     *
     * @return array{created: int, deleted: int, skipped_locked: int, guard_count: int}
     */
    public function publish(
        WeeklyRosterPlan $plan,
        string $weekStart,
        string $weekEnd,
        string $startTime,
        string $endTime,
        string $shiftType,
        int $userId,
    ): array {
        $guards = Guard::query()
            ->where('status', 'active')
            ->where(function ($q) use ($plan) {
                $q->where('supervisor_id', $plan->supervisor_id)
                    ->orWhereIn('guard_type', ['reliever', 'standby']);
            })
            ->get(['id']);

        $guardIds = $guards->pluck('id');
        if ($guardIds->isEmpty()) {
            return ['created' => 0, 'deleted' => 0, 'skipped_locked' => 0, 'guard_count' => 0];
        }

        $entries = WeeklyRosterPlanEntry::query()
            ->where('weekly_roster_plan_id', $plan->id)
            ->whereBetween('date', [$weekStart, $weekEnd])
            ->get();

        $entriesByGuardDay = [];
        foreach ($entries as $e) {
            $entriesByGuardDay[(int) $e->guard_id][Carbon::parse($e->date)->toDateString()] = $e;
        }

        $days = collect(range(0, 6))->map(fn($i) => Carbon::parse($weekStart)->copy()->addDays($i)->toDateString());

        $result = ['created' => 0, 'deleted' => 0, 'skipped_locked' => 0, 'guard_count' => $guardIds->count()];

        DB::transaction(function () use (
            $plan,
            $guardIds,
            $days,
            $shiftType,
            $startTime,
            $endTime,
            $userId,
            $entriesByGuardDay,
            &$result,
        ) {
            // Delete existing scheduled shifts for this scope (skip in-progress/completed)
            $existing = GuardShift::query()
                ->whereIn('guard_id', $guardIds)
                ->whereBetween('date', [$days->first(), $days->last()])
                ->where('shift_type', $shiftType)
                ->whereNotIn('status', ['in_progress', 'completed'])
                ->get(['id']);

            if ($existing->isNotEmpty()) {
                $result['deleted'] = GuardShift::whereIn('id', $existing->pluck('id'))->delete();
            }

            foreach ($guardIds as $gid) {
                foreach ($days as $d) {
                    $entry = $entriesByGuardDay[$gid][$d] ?? null;

                    $locked = GuardShift::query()
                        ->where('guard_id', $gid)
                        ->whereDate('date', $d)
                        ->where('shift_type', $shiftType)
                        ->whereIn('status', ['in_progress', 'completed'])
                        ->exists();

                    if ($locked) {
                        $result['skipped_locked']++;
                        continue;
                    }

                    // Reconcile exceptions based on template baseline — intent-only
                    $templateDayStatus = $this->resolver->getTemplateDayStatus((int) $gid, $d);
                    $templateIsOff = !empty($templateDayStatus['is_off']);

                    if ($entry && $entry->entry_type === 'off') {
                        // OFF entry: intent=off when template says WORK, else clear opposing intents
                        if (!$templateIsOff) {
                            GuardRotaException::updateOrCreate(
                                [
                                    'guard_id' => (int) $gid,
                                    'start_date' => $d,
                                    'end_date' => $d,
                                    'intent' => 'off',
                                ],
                                [
                                    'notes' => $entry?->notes ?: 'Weekly plan off-day',
                                ]
                            );
                        }
                        // Remove any work intent exception
                        GuardRotaException::where([
                            'guard_id' => (int) $gid,
                            'start_date' => $d,
                            'end_date' => $d,
                            'intent' => 'work',
                        ])->delete();
                    } elseif ($entry && $entry->entry_type === 'site') {
                        // WORK entry: intent=work when template says OFF, else clear opposing intents
                        if ($templateIsOff) {
                            GuardRotaException::updateOrCreate(
                                [
                                    'guard_id' => (int) $gid,
                                    'start_date' => $d,
                                    'end_date' => $d,
                                    'intent' => 'work',
                                ],
                                [
                                    'notes' => $entry?->notes ?: 'Weekly plan work override',
                                ]
                            );
                        }
                        // Remove any off intent exception
                        GuardRotaException::where([
                            'guard_id' => (int) $gid,
                            'start_date' => $d,
                            'end_date' => $d,
                            'intent' => 'off',
                        ])->delete();
                    } else {
                        // Cleared cell: revert to template by removing the opposing intent
                        $opposingIntent = $templateIsOff ? 'work' : 'off';
                        GuardRotaException::where([
                            'guard_id' => (int) $gid,
                            'start_date' => $d,
                            'end_date' => $d,
                            'intent' => $opposingIntent,
                        ])->delete();
                    }

                    // Final status after reconciliation
                    $finalStatus = $this->resolver->getDayStatus((int) $gid, $d);
                    if (!empty($finalStatus['is_off'])) {
                        continue;
                    }

                    // Work day: create shift if draft specified a site
                    if (empty($entry) || empty($entry->client_site_id)) {
                        continue;
                    }

                    $startDt = Carbon::parse($d . ' ' . $startTime . ':00');
                    $endDt = Carbon::parse($d . ' ' . $endTime . ':00');
                    if ($endDt->lessThanOrEqualTo($startDt)) {
                        $endDt->addDay();
                    }

                    GuardShift::create([
                        'guard_id' => $gid,
                        'client_site_id' => (int) $entry->client_site_id,
                        'assigned_by' => $userId,
                        'date' => $d,
                        'start_time' => $startDt,
                        'end_time' => $endDt,
                        'shift_type' => $shiftType,
                        'source' => 'weekly_planner',
                        'instructions' => null,
                        'status' => 'scheduled',
                        'notes' => $entry?->notes,
                    ]);

                    $result['created']++;
                }
            }

            $plan->update([
                'status' => 'published',
                'published_by' => $userId,
                'published_at' => now(),
            ]);
        });

        return $result;
    }
}
