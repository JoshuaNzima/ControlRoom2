<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientEvent;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class BusinessDevController extends Controller
{
    public function index()
    {
        $today = now();
        $monthStart = $today->copy()->startOfMonth();
        $monthEnd = $today->copy()->endOfMonth();

        $summary = [
            'upcoming_events' => (int) ClientEvent::whereDate('event_date', '>=', $today->toDateString())
                ->whereIn('status', ['planned', 'confirmed'])
                ->count(),
            'month_event_revenue' => (float) ClientEvent::whereBetween('event_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->whereIn('status', ['planned', 'confirmed', 'completed'])
                ->sum('expected_amount'),
            'k9_events_month' => (int) ClientEvent::whereBetween('event_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->where('category', 'k9')
                ->count(),
            'active_clients_with_events' => (int) ClientEvent::distinct('client_id')->count('client_id'),
        ];

        $events = ClientEvent::with('client')
            ->orderByDesc('event_date')
            ->orderByDesc('created_at')
            ->paginate(10);

        $clients = Client::orderBy('name')->get(['id', 'name']);

        $user = auth()->user();

        return Inertia::render('Admin/BusinessDev', [
            'summary' => $summary,
            'events' => $events,
            'clients' => $clients,
            'auth' => [
                'user' => [
                    'name' => $user?->name,
                    'roles' => $user?->roles ?? ['admin'],
                    'permissions' => $user?->permissions ?? [],
                ],
            ],
        ]);
    }
}
