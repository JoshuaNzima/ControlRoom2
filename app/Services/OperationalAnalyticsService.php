<?php

namespace App\Services;

use App\Models\Down;
use App\Models\Guards\Attendance;
use App\Models\Guards\GuardAssignment;

class OperationalAnalyticsService
{
    public function getSummary(?string $date = null): array
    {
        $dateString = $date ?: now()->toDateString();

        $downsOpen = (int) Down::query()->where('status', 'open')->count();
        $downsEscalated = (int) Down::query()->where('status', 'escalated')->count();
        $downsResolvedToday = (int) Down::query()
            ->where('status', 'resolved')
            ->whereDate('resolved_at', $dateString)
            ->count();

        $downsGuardAbsentOpen = (int) Down::query()
            ->whereIn('status', ['open', 'escalated'])
            ->where('type', 'guard_absent')
            ->count();

        $absentToday = (int) Attendance::query()
            ->whereDate('date', $dateString)
            ->where('status', 'absent')
            ->count();

        $coveredToday = (int) Attendance::query()
            ->whereDate('date', $dateString)
            ->where('status', 'covered')
            ->count();

        $checkedInToday = (int) Attendance::query()
            ->whereDate('date', $dateString)
            ->whereNotNull('check_in_time')
            ->distinct('guard_id')
            ->count('guard_id');

        $deploymentsToday = (int) GuardAssignment::query()
            ->whereDate('created_at', $dateString)
            ->count();

        return [
            'date' => $dateString,
            'downs_open' => $downsOpen,
            'downs_escalated' => $downsEscalated,
            'downs_guard_absent_open' => $downsGuardAbsentOpen,
            'downs_resolved_today' => $downsResolvedToday,
            'attendance_absent_today' => $absentToday,
            'attendance_covered_today' => $coveredToday,
            'attendance_checked_in_today' => $checkedInToday,
            'deployments_today' => $deploymentsToday,
        ];
    }
}
