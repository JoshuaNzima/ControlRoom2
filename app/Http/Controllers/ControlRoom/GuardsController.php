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

        $guards = Guard::with(['supervisor', 'todayAttendance'])
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
}
