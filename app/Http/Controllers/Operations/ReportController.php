<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Guards\Attendance;
use App\Models\Incident;
use App\Models\Down;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

/**
 * Operations Report Controller
 * Provides operational reports for the operations team
 */
class ReportController extends Controller
{
    public function attendance(Request $request)
    {
        $date = $request->input('date', Carbon::today()->toDateString());

        $attendance = Attendance::with(['guardRelation', 'clientSite.client'])
            ->whereDate('date', $date)
            ->orderByDesc('check_in_time')
            ->paginate(20);

        $attendance->getCollection()->transform(function (Attendance $record) {
            return [
                'id' => $record->id,
                'guard' => $record->guardRelation ? [
                    'id' => $record->guardRelation->id,
                    'name' => $record->guardRelation->name,
                ] : null,
                'site' => $record->clientSite ? [
                    'id' => $record->clientSite->id,
                    'name' => $record->clientSite->name,
                    'client' => $record->clientSite->client ? [
                        'id' => $record->clientSite->client->id,
                        'name' => $record->clientSite->client->name,
                    ] : null,
                ] : null,
                'date' => $record->date?->toDateString(),
                'check_in_time' => $record->check_in_time?->toIso8601String(),
                'check_out_time' => $record->check_out_time?->toIso8601String(),
                'status' => $record->status,
                'hours_worked' => (float) ($record->hours_worked ?? 0),
                'overtime_hours' => (float) ($record->overtime_hours ?? 0),
            ];
        });

        $stats = [
            'total' => Attendance::whereDate('date', $date)->count(),
            'checked_in' => Attendance::whereDate('date', $date)->whereNotNull('check_in_time')->count(),
            'checked_out' => Attendance::whereDate('date', $date)->whereNotNull('check_out_time')->count(),
            'absent' => Attendance::whereDate('date', $date)->where('status', 'absent')->count(),
        ];

        return Inertia::render('Operations/Reports/Attendance', [
            'attendance' => $attendance,
            'stats' => $stats,
            'date' => $date,
        ]);
    }

    public function deployments(Request $request)
    {
        return Inertia::render('Operations/Reports/Deployments', [
            'message' => 'Deployment reports coming soon',
        ]);
    }

    public function incidents(Request $request)
    {
        $incidents = Incident::with(['reporter', 'client', 'clientSite'])
            ->orderByDesc('created_at')
            ->paginate(20);

        $downs = Down::with(['reporter', 'client', 'clientSite'])
            ->orderByDesc('created_at')
            ->paginate(20);

        $incidents->getCollection()->transform(function (Incident $incident) {
            return [
                'id' => $incident->id,
                'title' => $incident->title,
                'severity' => $incident->severity,
                'status' => $incident->status,
                'created_at' => $incident->created_at?->toIso8601String(),
                'reporter' => $incident->reporter ? [
                    'id' => $incident->reporter->id,
                    'name' => $incident->reporter->name,
                ] : null,
                'client' => $incident->client ? [
                    'id' => $incident->client->id,
                    'name' => $incident->client->name,
                ] : null,
                'site' => $incident->clientSite ? [
                    'id' => $incident->clientSite->id,
                    'name' => $incident->clientSite->name,
                ] : null,
            ];
        });

        $downs->getCollection()->transform(function (Down $down) {
            return [
                'id' => $down->id,
                'title' => $down->title,
                'type' => $down->type,
                'status' => $down->status,
                'created_at' => $down->created_at?->toIso8601String(),
                'reporter' => $down->reporter ? [
                    'id' => $down->reporter->id,
                    'name' => $down->reporter->name,
                ] : null,
                'client' => $down->client ? [
                    'id' => $down->client->id,
                    'name' => $down->client->name,
                ] : null,
                'site' => $down->clientSite ? [
                    'id' => $down->clientSite->id,
                    'name' => $down->clientSite->name,
                ] : null,
            ];
        });

        return Inertia::render('Operations/Reports/Incidents', [
            'incidents' => $incidents,
            'downs' => $downs,
        ]);
    }
}
