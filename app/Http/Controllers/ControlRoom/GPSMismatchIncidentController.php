<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\GPSMismatchIncident;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GPSMismatchIncidentController extends Controller
{
    public function index(Request $request)
    {
        $query = GPSMismatchIncident::query()
            ->with(['user:id,name', 'site:id,name', 'checkpoint:id,name,client_site_id']);

        if ($request->filled('site_id')) {
            $query->where('site_id', (int) $request->string('site_id'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->string('user_id'));
        }

        if ($request->filled('escalated')) {
            $val = $request->string('escalated')->toString();
            if ($val === '1' || $val === '0') {
                $query->where('escalated', (bool) ((int) $val));
            }
        }

        if ($request->filled('from')) {
            try {
                $from = Carbon::parse($request->string('from')->toString())->startOfDay();
                $query->where('occurred_at', '>=', $from);
            } catch (\Throwable $e) {
            }
        }

        if ($request->filled('to')) {
            try {
                $to = Carbon::parse($request->string('to')->toString())->endOfDay();
                $query->where('occurred_at', '<=', $to);
            } catch (\Throwable $e) {
            }
        }

        $incidents = $query->orderBy('occurred_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('ControlRoom/GPSMismatchIncidents/Index', [
            'incidents' => $incidents,
            'filters' => $request->only(['site_id', 'user_id', 'escalated', 'from', 'to']),
        ]);
    }
}
