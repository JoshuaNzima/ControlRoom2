<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardGrade;
use App\Models\Zone;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DirectoryController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 20);
        $perPage = max(5, min($perPage, 100));

        $allowedSorts = ['name', 'employee_id', 'status', 'zone_id', 'supervisor_id'];
        $sort = $request->input('sort', 'name');
        if (!in_array($sort, $allowedSorts, true)) {
            $sort = 'name';
        }
        $dir = strtolower((string) $request->input('dir', 'asc')) === 'desc' ? 'desc' : 'asc';

        $guards = Guard::with(['supervisor', 'todayAttendance', 'activeAssignments.clientSite.client'])
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                       ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->when($request->input('status'), function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($request->input('zone_id'), function ($q, $zoneId) {
                $q->where('zone_id', (int) $zoneId);
            })
            ->when($request->input('grade_id'), function ($q, $gradeId) {
                $q->where('guard_grade_id', (int) $gradeId);
            })
            ->when(in_array($request->input('on_duty'), ['1', 1, true, 'true'], true), function ($q) {
                $q->whereHas('todayAttendance', function ($qa) {
                    $qa->whereNotNull('check_in_time')->whereNull('check_out_time');
                });
            })
            ->orderBy($sort, $dir)
            ->paginate($perPage)
            ->withQueryString()
            ->through(function ($g) {
                return [
                    'id' => $g->id,
                    'name' => $g->name,
                    'employee_id' => $g->employee_id,
                    'status' => $g->status,
                    'supervisor' => $g->supervisor ? ['id' => $g->supervisor->id, 'name' => $g->supervisor->name] : null,
                    'today_attendance' => $g->todayAttendance?->first() ? [
                        'check_in' => optional($g->todayAttendance->first()->check_in_time)->format('H:i'),
                        'check_out' => optional($g->todayAttendance->first()->check_out_time)->format('H:i'),
                    ] : null,
                    'active_assignment' => (function() use ($g) {
                        $a = $g->activeAssignments->first();
                        if (!$a || !$a->clientSite) return null;
                        return [
                            'site_id' => $a->clientSite->id ?? null,
                            'site_name' => $a->clientSite->name ?? null,
                            'client_name' => optional($a->clientSite->client)->name,
                        ];
                    })(),
                ];
            });

        // Calculate stats for ALL guards (not just paginated)
        $statsQuery = Guard::query()
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                       ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->when($request->input('status'), function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($request->input('zone_id'), function ($q, $zoneId) {
                $q->where('zone_id', (int) $zoneId);
            })
            ->when($request->input('grade_id'), function ($q, $gradeId) {
                $q->where('guard_grade_id', (int) $gradeId);
            });

        $totalGuards = $statsQuery->count();
        $activeGuards = (clone $statsQuery)->where('status', 'active')->count();
        $onDutyGuards = (clone $statsQuery)->whereHas('todayAttendance', function ($qa) {
            $qa->whereNotNull('check_in_time')->whereNull('check_out_time');
        })->count();
        $offDutyGuards = $totalGuards - $onDutyGuards;

        return Inertia::render('Guards/Index', [
            'guards' => $guards,
            'filters' => $request->only(['search','status','zone_id','grade_id','on_duty','sort','dir','per_page']),
            'grades' => GuardGrade::orderBy('name')->get(['id','code','name']),
            'zones' => Zone::orderBy('name')->get(['id','name']),
            'stats' => [
                'total' => $totalGuards,
                'active' => $activeGuards,
                'on_duty' => $onDutyGuards,
                'off_duty' => $offDutyGuards,
            ],
        ]);
    }

    public function showJson(Guard $guard)
    {
        $guard->load(['supervisor', 'zone', 'grade', 'activeAssignments', 'assignments.clientSite.client']);

        return response()->json([
            'id' => $guard->id,
            'employee_id' => $guard->employee_id,
            'name' => $guard->name,
            'phone' => $guard->phone,
            'email' => $guard->email,
            'status' => $guard->status,
            'guard_type' => $guard->guard_type,
            'hire_date' => optional($guard->hire_date)->format('Y-m-d'),
            'zone' => $guard->zone ? ['id' => $guard->zone->id, 'name' => $guard->zone->name] : null,
            'grade' => $guard->grade ? ['id' => $guard->grade->id, 'name' => $guard->grade->name, 'code' => $guard->grade->code ?? null] : null,
            'supervisor' => $guard->supervisor ? ['id' => $guard->supervisor->id, 'name' => $guard->supervisor->name] : null,
            'photo_url' => $guard->photo ? url('storage/'.$guard->photo) : null,
            'assignments' => $guard->assignments->map(function ($a) {
                return [
                    'id' => $a->id,
                    'site' => $a->clientSite ? [
                        'id' => $a->clientSite->id,
                        'name' => $a->clientSite->name,
                        'client' => $a->clientSite->client ? [
                            'id' => $a->clientSite->client->id,
                            'name' => $a->clientSite->client->name,
                        ] : null,
                    ] : null,
                    'start_date' => $a->start_date,
                    'end_date' => $a->end_date,
                    'is_active' => (bool) $a->is_active,
                ];
            }),
        ]);
    }

    /**
     * Dashboard for guard role users (their own profile/summary)
     */
    public function myDashboard(Request $request)
    {
        $user = $request->user();
        $guard = Guard::where('user_id', $user->id)->first();

        if (!$guard) {
            return Inertia::render('Guards/Index', [
                'guards' => [],
                'filters' => [],
                'grades' => GuardGrade::orderBy('name')->get(['id','code','name']),
                'zones' => Zone::orderBy('name')->get(['id','name']),
                'stats' => ['total' => 0, 'active' => 0, 'on_duty' => 0, 'off_duty' => 0],
            ]);
        }

        // Redirect to profile page for guards
        return redirect()->route('guard.profile');
    }
}
