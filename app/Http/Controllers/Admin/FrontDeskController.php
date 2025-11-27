<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class FrontDeskController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $summary = [
            'open_tickets' => 0,
            'visitors_today' => 0,
            'scheduled_appointments' => 0,
        ];

        return Inertia::render('Admin/FrontDesk', [
            'summary' => $summary,
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
