<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Guards\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Operations Shift Controller
 * Provides shift overview for operations team
 */
class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $shifts = Shift::with(['site', 'guard', 'zone'])
            ->when($request->date, fn($q, $date) => $q->whereDate('date', $date))
            ->when($request->site_id, fn($q, $siteId) => $q->where('client_site_id', $siteId))
            ->orderBy('date', 'desc')
            ->paginate(20);

        return Inertia::render('Operations/Shifts/Index', [
            'shifts' => $shifts,
            'filters' => $request->only(['date', 'site_id']),
        ]);
    }

    public function show(Shift $shift)
    {
        $shift->load(['site', 'guard', 'zone', 'attendance']);

        return Inertia::render('Operations/Shifts/Show', [
            'shift' => $shift,
        ]);
    }
}
