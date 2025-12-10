<?php

namespace App\Http\Controllers\FrontOffice;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('FrontOffice/Dashboard', [
            'auth' => [
                'user' => [
                    'id' => $user?->id,
                    'name' => $user?->name,
                    'roles' => $user?->getRoleNames(),
                ],
            ],
            'stats' => [
                'visitors_today' => 0,
                'deliveries_today' => 0,
                'appointments_today' => 0,
            ],
        ]);
    }
}
