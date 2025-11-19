<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Client;

class LandingController extends Controller
{
    public function index()
    {
        $metrics = [
            'guards_total' => Guard::count(),
            'sites_total' => ClientSite::where('status', 'active')->count(),
            'clients_total' => Client::count(),
            'uptime_pct' => 99.8,
        ];

        return Inertia::render('Public/Home', [
            'metrics' => $metrics,
        ]);
    }
}
