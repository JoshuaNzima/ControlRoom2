<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Guards\Attendance;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class CalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $now = now();
        $month = (int) $request->input('month', (int) $now->month);
        $year = (int) $request->input('year', (int) $now->year);

        $start = Carbon::createFromDate($year, $month, 1)->startOfDay();
        $end = (clone $start)->endOfMonth();

        $raw = Attendance::whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('date, status, COUNT(*) as count, SUM(CASE WHEN backdated = 1 THEN 1 ELSE 0 END) as backdated_count')
            ->groupBy('date', 'status')
            ->orderBy('date')
            ->get();

        $days = [];
        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            $key = $cursor->toDateString();
            $days[$key] = [
                'date' => $key,
                'weekday' => $cursor->dayOfWeek,
                'statuses' => [],
                'total' => 0,
            ];
            $cursor->addDay();
        }

        $summaryByStatus = [];
        $totalRecords = 0;

        foreach ($raw as $row) {
            $key = Carbon::parse($row->date)->toDateString();
            if (!isset($days[$key])) {
                $days[$key] = [
                    'date' => $key,
                    'weekday' => Carbon::parse($row->date)->dayOfWeek,
                    'statuses' => [],
                    'total' => 0,
                ];
            }

            $days[$key]['statuses'][$row->status] = [
                'count' => (int) $row->count,
                'backdated_count' => (int) $row->backdated_count,
            ];
            $days[$key]['total'] += (int) $row->count;

            $summaryByStatus[$row->status] = ($summaryByStatus[$row->status] ?? 0) + (int) $row->count;
            $totalRecords += (int) $row->count;
        }

        return Inertia::render('Guards/Calendar', [
            'month' => $month,
            'year' => $year,
            'days' => array_values($days),
            'summary' => [
                'total_records' => $totalRecords,
                'by_status' => $summaryByStatus,
            ],
        ]);
    }
}
