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
        $guards = Guard::query()
            ->with([
                'supervisor',
                'zone',
                'currentAssignmentRelation.clientSite',
                'currentAssignmentRelation.clientSite.client',
                'currentAssignmentRelation.clientSite.zone',
            ])
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->paginate(20);

        $guards->getCollection()->transform(function (Guard $guard) {
            $site = $guard->currentAssignmentRelation?->clientSite;

            return [
                'id' => $guard->id,
                'name' => $guard->name,
                'employee_id' => $guard->employee_id,
                'status' => $guard->status,
                'site' => $site ? [
                    'id' => $site->id,
                    'name' => $site->name,
                ] : null,
                'supervisor' => $guard->supervisor ? [
                    'id' => $guard->supervisor->id,
                    'name' => $guard->supervisor->name,
                ] : null,
                'zone' => $guard->zone ? [
                    'id' => $guard->zone->id,
                    'name' => $guard->zone->name,
                ] : null,
            ];
        });

        return Inertia::render('Operations/Guards/Index', [
            'guards' => $guards,
            'filters' => $request->only(['status']),
        ]);
    }

    public function show(Guard $guard)
    {
        $guard->load([
            'supervisor',
            'zone',
            'currentAssignmentRelation.clientSite.client',
            'currentAssignmentRelation.clientSite.zone',
            'attendance' => fn($q) => $q->latest()->take(10),
        ]);

        $site = $guard->currentAssignmentRelation?->clientSite;

        return Inertia::render('Operations/Guards/Show', [
            'guard' => [
                'id' => $guard->id,
                'name' => $guard->name,
                'employee_id' => $guard->employee_id,
                'status' => $guard->status,
                'site' => $site ? [
                    'id' => $site->id,
                    'name' => $site->name,
                ] : null,
                'supervisor' => $guard->supervisor ? [
                    'id' => $guard->supervisor->id,
                    'name' => $guard->supervisor->name,
                ] : null,
                'zone' => $guard->zone ? [
                    'id' => $guard->zone->id,
                    'name' => $guard->zone->name,
                ] : null,
                'attendance' => $guard->attendance,
            ],
        ]);
    }
}
