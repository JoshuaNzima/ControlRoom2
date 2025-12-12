<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\Guards\Client;
use App\Models\Guards\GuardGrade;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Http\Request;
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

        return Inertia::render('ControlRoom/Guards/Index', [
            'guards' => $guards,
            'filters' => $request->only(['search','status','zone_id','grade_id','on_duty','sort','dir','per_page']),
            'supervisors' => User::role(['supervisor','manager','operations_officer'])->orderBy('name')->get(['id','name']),
            'clients' => Client::orderBy('name')->get(['id','name']),
            'grades' => GuardGrade::orderBy('name')->get(['id','code','name']),
            'zones' => Zone::orderBy('name')->get(['id','name']),
            'canAssignSupervisor' => (function(){
                $u = auth()->user();
                if (!$u) return false;
                return $u->hasAnyRole(['operations_officer','manager','super_admin','control_room_operator'])
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

        $guards = Guard::with(['supervisor', 'zone', 'grade', 'todayAttendance'])
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
            fputcsv($out, ['ID', 'Employee ID', 'Name', 'Status', 'Zone', 'Grade', 'Supervisor', 'On Duty']);
            foreach ($guards as $g) {
                $today = $g->todayAttendance->first();
                $onDuty = $today && $today->check_in_time && !$today->check_out_time ? 'yes' : 'no';
                fputcsv($out, [
                    $g->id,
                    $g->employee_id,
                    $g->name,
                    $g->status,
                    optional($g->zone)->name,
                    optional($g->grade)->name,
                    optional($g->supervisor)->name,
                    $onDuty,
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

        return response()->json([
            'id' => $guard->id,
            'employee_id' => $guard->employee_id,
            'name' => $guard->name,
            'phone' => $guard->phone,
            'email' => $guard->email,
            'status' => $guard->status,
            'guard_type' => $guard->guard_type,
            'hire_date' => optional($guard->hire_date)->format('Y-m-d'),
            'id_number' => $guard->id_number,
            'address' => $guard->address,
            'residence_address' => $guard->residence_address,
            'residence_city' => $guard->residence_city,
            'residence_district' => $guard->residence_district,
            'gender' => $guard->gender,
            'date_of_birth' => optional($guard->date_of_birth)->format('Y-m-d'),
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
}
