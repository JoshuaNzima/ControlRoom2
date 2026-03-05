<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Guards\ClientSite;
use App\Models\Zone;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Operations Coverage Controller
 * Provides site coverage overview for operations team
 */
class CoverageController extends Controller
{
    public function index(Request $request)
    {
        $zones = Zone::with(['sites' => fn($q) => $q->with(['guards', 'shifts' => fn($s) => $s->today()])])->get();

        return Inertia::render('Operations/Coverage/Index', [
            'zones' => $zones,
        ]);
    }

    public function sites(Request $request)
    {
        $sites = ClientSite::with(['guards', 'shifts' => fn($q) => $q->today(), 'client'])
            ->when($request->zone_id, fn($q, $zoneId) => $q->where('zone_id', $zoneId))
            ->paginate(20);

        return Inertia::render('Operations/Coverage/Sites', [
            'sites' => $sites,
            'filters' => $request->only(['zone_id']),
        ]);
    }
}
