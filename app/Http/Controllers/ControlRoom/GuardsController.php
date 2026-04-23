<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\Guards\Attendance;
use App\Models\Guards\Client;
use App\Models\Guards\GuardGrade;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GuardsController extends Controller
{
    public function index()
    {
        $request = request();
        $perPage = (int) $request->input('per_page', 20);
        $perPage = max(5, min($perPage, 100));

        $allowedSorts = ['name', 'employee_id', 'status', 'zone_id', 'supervisor_id'];
        $sort = $request->input('sort', 'name');
        if (!in_array($sort, $allowedSorts, true)) {
            $sort = 'name';
        }
        $dir = strtolower((string) $request->input('dir', 'asc')) === 'desc' ? 'desc' : 'asc';

        // Determine view mode (active or inactive)
        $view = $request->input('view', 'active');
        $activeStatuses = ['active', 'on_leave', 'training'];
        $inactiveStatuses = ['inactive', 'suspended', 'dismissed', 'absconded', 'resigned', 'retired'];

        $guards = Guard::with(['supervisor', 'todayAttendance', 'activeAssignments.clientSite.client'])
            ->where('employee_role', 'guard')
            ->when($view === 'active', function ($q) use ($activeStatuses) {
                $q->whereIn('status', $activeStatuses);
            })
            ->when($view === 'inactive', function ($q) use ($inactiveStatuses) {
                $q->whereIn('status', $inactiveStatuses);
            })
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                       ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->when($request->input('status'), function ($q, $status) {
                $q->where('status', $status);
            })
            ->profileStatus($request->input('profile_status'))
            ->when($request->input('zone_id'), function ($q, $zoneId) {
                $q->where('zone_id', (int) $zoneId);
            })
            ->when($request->input('client_id'), function ($q, $clientId) {
                $q->whereHas('activeAssignments.clientSite', function ($qq) use ($clientId) {
                    $qq->where('client_id', (int) $clientId);
                });
            })
            ->when($request->input('supervisor_id'), function ($q, $supervisorId) {
                if ($supervisorId === 'unassigned') {
                    $q->whereNull('supervisor_id');
                } else {
                    $q->where('supervisor_id', (int) $supervisorId);
                }
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
                $today = $g->todayAttendance?->first();
                return [
                    'id' => $g->id,
                    'name' => $g->name,
                    'employee_id' => $g->employee_id,
                    'status' => $g->status,
                    'is_profile_complete' => (bool) $g->is_profile_complete,
                    'profile_missing_fields' => $g->profile_missing_fields,
                    'supervisor' => $g->supervisor ? ['id' => $g->supervisor->id, 'name' => $g->supervisor->name] : null,
                    'today_attendance' => $today ? [
                        'check_in' => optional($today->check_in_time)->format('H:i'),
                        'check_out' => optional($today->check_out_time)->format('H:i'),
                        'status' => $today->status,
                        'source' => $today->source,
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
            ->where('employee_role', 'guard')
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                       ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->when($request->input('status'), function ($q, $status) {
                $q->where('status', $status);
            })
            ->profileStatus($request->input('profile_status'))
            ->when($request->input('zone_id'), function ($q, $zoneId) {
                $q->where('zone_id', (int) $zoneId);
            })
            ->when($request->input('client_id'), function ($q, $clientId) {
                $q->whereHas('activeAssignments.clientSite', function ($qq) use ($clientId) {
                    $qq->where('client_id', (int) $clientId);
                });
            })
            ->when($request->input('supervisor_id'), function ($q, $supervisorId) {
                if ($supervisorId === 'unassigned') {
                    $q->whereNull('supervisor_id');
                } else {
                    $q->where('supervisor_id', (int) $supervisorId);
                }
            });

        $stats = [
            'total' => $statsQuery->count(),
            'active' => (clone $statsQuery)->where('status', 'active')->count(),
            'inactive' => (clone $statsQuery)->whereIn('status', $inactiveStatuses)->count(),
            'assigned' => (clone $statsQuery)->whereHas('activeAssignments')->count(),
            'incomplete' => (clone $statsQuery)->where(function ($q) {
                $q->whereNull('id_number')->orWhere('id_number', '')
                  ->orWhereNull('emergency_contact_name')->orWhere('emergency_contact_name', '')
                  ->orWhereNull('emergency_contact_phone')->orWhere('emergency_contact_phone', '');
            })->count(),
        ];

        return Inertia::render('ControlRoom/Guards/Index', [
            'guards' => $guards,
            'inactiveGuards' => $view === 'inactive' ? $guards : null,
            'filters' => $request->only(['search','status','profile_status','zone_id','client_id','supervisor_id','on_duty','sort','dir','per_page','view']),
            'supervisors' => User::role(['supervisor','operations_officer','sergeant'])->where('status', 'active')->orderBy('name')->get(['id','name']),
            'leaders' => Guard::leaders()->where('status', 'active')->orderBy('name')->get(['id','name','position']),
            'clients' => Client::orderBy('name')->get(['id','name']),
            'zones' => Zone::orderBy('name')->get(['id','name']),
            'stats' => $stats,
            'can' => [
                // Control room operators, HR and super admins can perform status actions
                'suspend' => auth()->user()?->hasAnyRole(['operations_officer','super_admin','control_room_operator','hr','hr_manager']),
                'dismiss' => auth()->user()?->hasAnyRole(['operations_officer','super_admin','control_room_operator','hr','hr_manager']),
                'reinstate' => auth()->user()?->hasAnyRole(['operations_officer','super_admin','control_room_operator','hr','hr_manager']),
            ],
            'canAssignSupervisor' => (function(){
                $u = auth()->user();
                if (!$u) return false;
                return $u->hasAnyRole(['operations_officer','super_admin','control_room_operator'])
                    || (method_exists($u, 'can') && $u->can('control_room_operator'));
            })(),
        ]);
    }

    public function search(Request $request)
    {
        $q = trim((string) $request->input('q', ''));
        $limit = min(50, max(5, (int) $request->input('limit', 20)));

        $guards = Guard::query()
            ->when($q, function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('name', 'like', "%{$q}%")
                      ->orWhere('employee_id', 'like', "%{$q}%");
                });
            })
            ->orderBy('name')
            ->limit($limit)
            ->get(['id','name','employee_id','status']);

        return response()->json($guards->map(function ($g) {
            return [
                'id' => $g->id,
                'name' => $g->name,
                'employee_id' => $g->employee_id,
                'status' => $g->status,
            ];
        }));
    }

    public function export()
    {
        $request = request();

        $allowedSorts = ['name', 'employee_id', 'status', 'zone_id', 'supervisor_id'];
        $sort = $request->input('sort', 'name');
        if (!in_array($sort, $allowedSorts, true)) {
            $sort = 'name';
        }
        $dir = strtolower((string) $request->input('dir', 'asc')) === 'desc' ? 'desc' : 'asc';

        $guards = Guard::with(['supervisor', 'grade', 'activeAssignments.clientSite.client'])
            ->whereNotIn('status', ['dismissed', 'absconded'])
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                       ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->when($request->input('status'), function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($request->input('employee_role'), function ($q, $role) {
                $q->where('employee_role', $role);
            })
            ->profileStatus($request->input('profile_status'))
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
            ->limit(2000)
            ->get();

        $filename = 'guards_export_' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($guards) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['ID', 'Employee ID', 'Name', 'ID Number', 'Status', 'Grade', 'Supervisor', 'Client', 'Site']);
            foreach ($guards as $g) {
                $a = $g->activeAssignments->first();
                $clientName = $a && $a->clientSite && $a->clientSite->client ? $a->clientSite->client->name : null;
                $siteName = $a && $a->clientSite ? $a->clientSite->name : null;
                fputcsv($out, [
                    $g->id,
                    $g->employee_id,
                    $g->name,
                    $g->id_number,
                    $g->status,
                    optional($g->grade)->name,
                    optional($g->supervisor)->name,
                    $clientName,
                    $siteName,
                ]);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function showJson(Guard $guard)
    {
        $guard->load(['supervisor', 'zone', 'grade', 'activeAssignments', 'assignments.clientSite.client']);

        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        $byStatus = Attendance::query()
            ->where('guard_id', $guard->id)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn ($v) => (int) $v)
            ->all();

        $hoursRow = Attendance::query()
            ->where('guard_id', $guard->id)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->select(
                DB::raw('coalesce(sum(hours_worked), 0) as hours_worked'),
                DB::raw('coalesce(sum(overtime_hours), 0) as overtime_hours')
            )
            ->first();

        return response()->json([
            'id' => $guard->id,
            'employee_id' => $guard->employee_id,
            'name' => $guard->name,
            'phone' => $guard->phone,
            'email' => $guard->email,
            'status' => $guard->status,
            'employee_role' => $guard->employee_role,
            'guard_type' => $guard->guard_type,
            'hire_date' => optional($guard->hire_date)->format('Y-m-d'),
            'id_number' => $guard->id_number,
            'address' => $guard->address,
            'residence_address' => $guard->residence_address,
            'residence_city' => $guard->residence_city,
            'residence_district' => $guard->residence_district,
            'gender' => $guard->gender,
            'date_of_birth' => optional($guard->date_of_birth)->format('Y-m-d'),
            'marital_status' => $guard->marital_status,
            'spouse_name' => $guard->spouse_name,
            'spouse_phone' => $guard->spouse_phone,
            'emergency_contact_name' => $guard->emergency_contact_name,
            'emergency_contact_phone' => $guard->emergency_contact_phone,
            'next_of_kin_name' => $guard->next_of_kin_name,
            'next_of_kin_relationship' => $guard->next_of_kin_relationship,
            'next_of_kin_phone' => $guard->next_of_kin_phone,
            'education_level' => $guard->education_level,
            'qualifications' => $guard->qualifications,
            'languages' => $guard->languages,
            'dependents_count' => $guard->dependents_count,
            'children_names' => $guard->children_names,
            'home_village' => $guard->home_village,
            'home_ta' => $guard->home_ta,
            'home_district' => $guard->home_district,
            'notes' => $guard->notes,
            'supervisor_id' => $guard->supervisor_id,
            'guard_grade_id' => $guard->guard_grade_id,
            'client_id' => $guard->client_id,
            'default_off_day' => $guard->default_off_day,
            'zone' => $guard->zone ? ['id' => $guard->zone->id, 'name' => $guard->zone->name] : null,
            'grade' => $guard->grade ? ['id' => $guard->grade->id, 'name' => $guard->grade->name, 'code' => $guard->grade->code ?? null] : null,
            'supervisor' => $guard->supervisor ? ['id' => $guard->supervisor->id, 'name' => $guard->supervisor->name] : null,
            'photo_url' => $guard->photo ? url('storage/'.$guard->photo) : null,
            'edit_count' => $guard->edit_count ?? 0,
            'attendance_tally' => [
                'range' => ['start' => $monthStart, 'end' => $monthEnd],
                'by_status' => $byStatus,
                'total' => array_sum($byStatus),
                'hours_worked' => (float) ($hoursRow->hours_worked ?? 0),
                'overtime_hours' => (float) ($hoursRow->overtime_hours ?? 0),
            ],
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
}
