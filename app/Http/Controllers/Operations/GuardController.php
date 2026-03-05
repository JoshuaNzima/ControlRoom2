<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Operations Guard Controller
 * Provides guard viewing access for operations team
 */
class GuardController extends Controller
{
    public function index(Request $request)
    {
        $guards = Guard::with(['site', 'supervisor', 'zone'])
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->paginate(20);

        return Inertia::render('Operations/Guards/Index', [
            'guards' => $guards,
            'filters' => $request->only(['status']),
        ]);
    }

    public function show(Guard $guard)
    {
        $guard->load(['site', 'supervisor', 'zone', 'attendance' => fn($q) => $q->latest()->take(10)]);

        return Inertia::render('Operations/Guards/Show', [
            'guard' => $guard,
        ]);
    }
}
