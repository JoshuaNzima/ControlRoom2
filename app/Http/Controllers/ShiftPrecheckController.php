<?php

namespace App\Http\Controllers;

use App\Models\Guards\Shift;
use App\Models\Guards\GuardAssignment;
use App\Models\Guards\GuardOffDay;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ShiftPrecheckController extends Controller
{
    public function precheck(Request $request)
    {
        $data = $request->validate([
            'guard_id' => ['required','integer','exists:guards,id'],
            'client_site_id' => ['required','integer','exists:client_sites,id'],
            'date' => ['required','date'],
            'start_time' => ['required','date_format:H:i'],
            'end_time' => ['required','date_format:H:i'],
            'exclude_id' => ['nullable','integer'],
        ]);

        $start = Carbon::parse($data['date'].' '.$data['start_time'].':00');
        $end = Carbon::parse($data['date'].' '.$data['end_time'].':00');
        if ($end->lessThanOrEqualTo($start)) { $end->addDay(); }

        $offDay = GuardOffDay::where('guard_id', $data['guard_id'])
            ->whereDate('start_date', '<=', $data['date'])
            ->where(function($q) use ($data) { $q->whereNull('end_date')->orWhereDate('end_date', '>=', $data['date']); })
            ->exists();

        $overlapQuery = Shift::where('guard_id', $data['guard_id'])
            ->where('status', '!=', 'cancelled')
            ->where(function($q) use ($start, $end) {
                $q->where('start_time', '<', $end)
                  ->where('end_time', '>', $start);
            });
        if (!empty($data['exclude_id'])) { $overlapQuery->where('id', '!=', $data['exclude_id']); }
        $overlap = $overlapQuery->exists();

        $assigned = GuardAssignment::active()->current()
            ->where('guard_id', $data['guard_id'])
            ->where('client_site_id', $data['client_site_id'])
            ->whereDate('start_date', '<=', $data['date'])
            ->where(function($q) use ($data) { $q->whereNull('end_date')->orWhereDate('end_date', '>=', $data['date']); })
            ->exists();

        return response()->json([
            'ok' => !$offDay && !$overlap && $assigned,
            'conflicts' => [
                'off_day' => (bool) $offDay,
                'overlap' => (bool) $overlap,
                'unassigned' => (bool) !$assigned,
            ],
        ]);
    }
}
