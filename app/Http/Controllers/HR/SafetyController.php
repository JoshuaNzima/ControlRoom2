<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\HR\HrSafetyIncident;
use App\Models\HR\HrNearMiss;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Notification;
use App\Models\User;
use App\Notifications\GenericDbNotification;

class SafetyController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('perPage', 15);
        $q = (string) $request->query('q', '');
        $type = (string) $request->query('type', '');
        $status = (string) $request->query('status', '');

        $incidents = HrSafetyIncident::with(['guardRelation:id,name,employee_id'])
            ->when(strlen($q) > 0, function($qq) use ($q){
                $qq->where('site','like',"%$q%")
                   ->orWhere('notes','like',"%$q%")
                   ->orWhere('type','like',"%$q%");
            })
            ->when(strlen($type) > 0, fn($qq) => $qq->where('type',$type))
            ->when(strlen($status) > 0, fn($qq) => $qq->where('status',$status))
            ->orderByRaw("CASE WHEN status='open' THEN 0 ELSE 1 END")
            ->orderByDesc('occurred_at')
            ->paginate($perPage)
            ->through(function($it){
                return [
                    'id' => $it->id,
                    'site' => $it->site,
                    'type' => $it->type,
                    'severity' => $it->severity,
                    'occurred_at' => optional($it->occurred_at)->toDateTimeString(),
                    'status' => $it->status,
                    'notes' => $it->notes,
                    'guard' => $it->guardRelation ? [
                        'id' => $it->guardRelation->id,
                        'name' => $it->guardRelation->name,
                        'employee_id' => $it->guardRelation->employee_id,
                    ] : null,
                ];
            })
            ->withQueryString();

        $nearMisses = HrNearMiss::orderByDesc('occurred_at')->paginate(10)->withQueryString();
        $guards = Guard::query()->where('status','active')->orderBy('name')->get(['id','name','employee_id']);

        return Inertia::render('HR/Safety', [
            'incidents' => $incidents,
            'nearMisses' => $nearMisses,
            'guards' => $guards,
            'filters' => [ 'q' => $q, 'type' => $type, 'status' => $status, 'perPage' => $perPage ],
        ]);
    }

    public function storeIncident(Request $request)
    {
        $data = $request->validate([
            'guard_id' => ['nullable','exists:guards,id'],
            'site' => ['nullable','string','max:255'],
            'type' => ['required','string','max:100'],
            'severity' => ['nullable','string','max:40'],
            'occurred_at' => ['nullable','date'],
            'notes' => ['nullable','string'],
        ]);
        $data['created_by'] = optional($request->user())->id;
        $data['status'] = 'open';
        $incident = HrSafetyIncident::create($data);

        // Notify safety managers
        try {
            $recipients = User::permission('hr.safety.manage')->get();
            if ($recipients->isEmpty()) {
                $recipients = User::role('super_admin')->get();
            }
            if ($recipients->isNotEmpty()) {
                $payload = [
                    'title' => 'Safety Incident reported',
                    'message' => sprintf('Type: %s%s%s', $data['type'] ?? '-', isset($data['severity']) && $data['severity'] ? ' · Severity: '.$data['severity'] : '', isset($data['site']) && $data['site'] ? ' · Site: '.$data['site'] : ''),
                    'url' => route('hr.safety.index'),
                ];
                Notification::send($recipients, new GenericDbNotification($payload));
            }
        } catch (\Throwable $e) {
            // swallow
        }
        return back()->with('success', 'Incident reported');
    }

    public function resolveIncident(HrSafetyIncident $incident)
    {
        $incident->status = 'closed';
        $incident->save();
        return back()->with('success', 'Incident resolved');
    }

    public function storeNearMiss(Request $request)
    {
        $data = $request->validate([
            'site' => ['nullable','string','max:255'],
            'description' => ['required','string'],
            'occurred_at' => ['nullable','date'],
        ]);
        HrNearMiss::create([
            'site' => $data['site'] ?? null,
            'description' => $data['description'],
            'occurred_at' => $data['occurred_at'] ?? Carbon::now(),
        ]);
        return back()->with('success', 'Near-miss recorded');
    }

    public function incidentsExport(Request $request)
    {
        $filename = 'hr_safety_incidents_' . now()->format('Ymd_His') . '.csv';
        $rows = [];
        $rows[] = ['ID','Type','Severity','Site','Status','Occurred At','Guard','Employee ID'];

        $items = HrSafetyIncident::with('guardRelation:id,name,employee_id')
            ->orderByDesc('occurred_at')
            ->get();

        foreach ($items as $it) {
            $rows[] = [
                $it->id,
                $it->type,
                $it->severity,
                $it->site,
                $it->status,
                optional($it->occurred_at)->toDateTimeString(),
                optional($it->guardRelation)->name,
                optional($it->guardRelation)->employee_id,
            ];
        }

        $callback = function () use ($rows) {
            $FH = fopen('php://output', 'w');
            foreach ($rows as $r) fputcsv($FH, $r);
            fclose($FH);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
