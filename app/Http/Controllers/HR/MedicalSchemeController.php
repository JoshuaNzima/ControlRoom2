<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\HR\HrMedicalMembership;
use App\Models\HR\HrMedicalScheme;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Notification;
use App\Models\User;
use App\Notifications\GenericDbNotification;

class MedicalSchemeController extends Controller
{
    public function index(Request $request)
    {
        $schemeSearch = (string) $request->query('scheme_search', '');
        $schemeStatus = (string) $request->query('scheme_status', '');
        $filterSchemeId = (int) $request->query('scheme_id', 0);
        $memberStatus = (string) $request->query('member_status', '');
        $memberSearch = (string) $request->query('member_search', '');
        $perPage = (int) ($request->query('per_page', 15));

        $schemes = HrMedicalScheme::query()
            ->when($schemeSearch !== '', fn($q) => $q->where(function($qq) use ($schemeSearch){
                $qq->where('name', 'like', "%$schemeSearch%")
                   ->orWhere('provider', 'like', "%$schemeSearch%")
                   ->orWhere('plan', 'like', "%$schemeSearch%");
            }))
            ->when($schemeStatus !== '', fn($q) => $q->where('status', $schemeStatus))
            ->orderBy('name')
            ->paginate(10)
            ->through(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'provider' => $s->provider,
                'plan' => $s->plan,
                'status' => $s->status,
                'created_at' => optional($s->created_at)->toDateTimeString(),
            ])
            ->withQueryString();

        $memberships = HrMedicalMembership::with(['scheme:id,name','guard:id,name,employee_id'])
            ->when($filterSchemeId > 0, fn($q) => $q->where('hr_medical_scheme_id', $filterSchemeId))
            ->when($memberStatus !== '', fn($q) => $q->where('status', $memberStatus))
            ->when($memberSearch !== '', function ($q) use ($memberSearch) {
                $q->whereHas('guard', function ($qq) use ($memberSearch) {
                    $qq->where('name', 'like', "%$memberSearch%")
                       ->orWhere('employee_id', 'like', "%$memberSearch%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->through(function ($m) {
                return [
                    'id' => $m->id,
                    'member_no' => $m->member_no,
                    'status' => $m->status,
                    'start_date' => optional($m->start_date)->toDateString(),
                    'end_date' => optional($m->end_date)->toDateString(),
                    'scheme' => $m->scheme ? [ 'id' => $m->scheme->id, 'name' => $m->scheme->name ] : null,
                    'guard' => $m->guard ? [ 'id' => $m->guard->id, 'name' => $m->guard->name, 'employee_id' => $m->guard->employee_id ] : null,
                    'created_at' => optional($m->created_at)->toDateTimeString(),
                ];
            })
            ->withQueryString();

        $guardOptions = Guard::orderBy('name')->limit(200)->get(['id','name','employee_id'])
            ->map(fn($g) => ['id' => $g->id, 'name' => $g->name, 'employee_id' => $g->employee_id]);

        return Inertia::render('HR/Medical', [
            'schemes' => $schemes,
            'memberships' => $memberships,
            'guards' => $guardOptions,
            'filters' => [
                'scheme_search' => $schemeSearch,
                'scheme_status' => $schemeStatus,
                'scheme_id' => $filterSchemeId,
                'member_status' => $memberStatus,
                'member_search' => $memberSearch,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function storeScheme(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'provider' => ['nullable','string','max:255'],
            'plan' => ['nullable','string','max:255'],
            'status' => ['required','in:active,inactive'],
        ]);
        $data['created_by'] = optional($request->user())->id;
        HrMedicalScheme::create($data);
        return back()->with('success', 'Scheme created');
    }

    public function updateScheme(Request $request, HrMedicalScheme $scheme)
    {
        $data = $request->validate([
            'name' => ['sometimes','string','max:255'],
            'provider' => ['nullable','string','max:255'],
            'plan' => ['nullable','string','max:255'],
            'status' => ['sometimes','in:active,inactive'],
        ]);
        $scheme->update($data);
        return back()->with('success', 'Scheme updated');
    }

    public function destroyScheme(HrMedicalScheme $scheme)
    {
        $scheme->delete();
        return back()->with('success', 'Scheme deleted');
    }

    public function storeMembership(Request $request)
    {
        $data = $request->validate([
            'hr_medical_scheme_id' => ['required','exists:hr_medical_schemes,id'],
            'guard_id' => ['required','exists:guards,id'],
            'start_date' => ['nullable','date'],
            'end_date' => ['nullable','date','after_or_equal:start_date'],
            'member_no' => ['nullable','string','max:100'],
            'status' => ['required','in:active,inactive,cancelled'],
        ]);
        if (empty($data['start_date'])) $data['start_date'] = now()->toDateString();
        $data['created_by'] = optional($request->user())->id;
        $membership = HrMedicalMembership::create($data);

        // Notify HR managers of new medical enrollment
        try {
            $recipients = User::permission('hr.employees.manage')->get();
            if ($recipients->isEmpty()) {
                $recipients = User::role('super_admin')->get();
            }
            if ($recipients->isNotEmpty()) {
                $membership->loadMissing(['scheme:id,name','guard:id,name,employee_id']);
                $payload = [
                    'title' => 'New Medical Membership',
                    'message' => sprintf('%s enrolled to %s', optional($membership->guard)->name ?? 'Guard', optional($membership->scheme)->name ?? 'Scheme'),
                    'url' => route('hr.medical.index'),
                ];
                Notification::send($recipients, new GenericDbNotification($payload));
            }
        } catch (\Throwable $e) {
            // swallow
        }
        return back()->with('success', 'Membership created');
    }

    public function updateMembership(Request $request, HrMedicalMembership $membership)
    {
        $data = $request->validate([
            'start_date' => ['nullable','date'],
            'end_date' => ['nullable','date','after_or_equal:start_date'],
            'member_no' => ['nullable','string','max:100'],
            'status' => ['nullable','in:active,inactive,cancelled'],
        ]);
        $membership->update($data);

        // Notify HR managers of membership update
        try {
            $recipients = User::permission('hr.employees.manage')->get();
            if ($recipients->isEmpty()) {
                $recipients = User::role('super_admin')->get();
            }
            if ($recipients->isNotEmpty()) {
                $membership->loadMissing(['scheme:id,name','guard:id,name,employee_id']);
                $payload = [
                    'title' => 'Medical Membership Updated',
                    'message' => sprintf('%s membership on %s updated', optional($membership->guard)->name ?? 'Guard', optional($membership->scheme)->name ?? 'Scheme'),
                    'url' => route('hr.medical.index'),
                ];
                Notification::send($recipients, new GenericDbNotification($payload));
            }
        } catch (\Throwable $e) {
            // swallow
        }
        return back()->with('success', 'Membership updated');
    }

    public function destroyMembership(HrMedicalMembership $membership)
    {
        $membership->delete();
        return back()->with('success', 'Membership deleted');
    }

    public function membershipsExport(Request $request)
    {
        $filterSchemeId = (int) $request->query('scheme_id', 0);
        $memberStatus = (string) $request->query('member_status', '');
        $memberSearch = (string) $request->query('member_search', '');

        $items = HrMedicalMembership::with(['scheme:id,name','guard:id,name,employee_id'])
            ->when($filterSchemeId > 0, fn($q) => $q->where('hr_medical_scheme_id', $filterSchemeId))
            ->when($memberStatus !== '', fn($q) => $q->where('status', $memberStatus))
            ->when($memberSearch !== '', function ($q) use ($memberSearch) {
                $q->whereHas('guard', function ($qq) use ($memberSearch) {
                    $qq->where('name', 'like', "%$memberSearch%")
                       ->orWhere('employee_id', 'like', "%$memberSearch%");
                });
            })
            ->orderByDesc('created_at')
            ->get();

        $filename = 'medical_memberships_' . now()->format('Ymd_His') . '.csv';
        $rows = [];
        $rows[] = ['ID','Scheme','Employee ID','Guard Name','Member No','Status','Start Date','End Date','Created At'];
        foreach ($items as $m) {
            $rows[] = [
                $m->id,
                optional($m->scheme)->name,
                optional($m->guard)->employee_id,
                optional($m->guard)->name,
                $m->member_no,
                $m->status,
                optional($m->start_date)->toDateString(),
                optional($m->end_date)->toDateString(),
                optional($m->created_at)->toDateTimeString(),
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
