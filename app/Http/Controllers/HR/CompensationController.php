<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\HR\HrCompChange;
use App\Models\HR\HrSalaryBand;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Notification;
use App\Notifications\GenericDbNotification;
use App\Models\User;

class CompensationController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('perPage', 15);
        $q = (string) $request->query('q', '');
        $active = $request->query('active');

        $bands = HrSalaryBand::query()
            ->when(strlen($q) > 0, function($qq) use ($q){
                $qq->where('title','like',"%$q%")
                   ->orWhere('code','like',"%$q%");
            })
            ->when($active !== null && $active !== '', function($qq) use ($active){
                $qq->where('active', filter_var($active, FILTER_VALIDATE_BOOLEAN));
            })
            ->orderBy('title')
            ->paginate($perPage)
            ->withQueryString();

        $changes = HrCompChange::with(['guardRelation:id,name,employee_id','band:id,code,title'])
            ->orderByRaw("CASE WHEN status='pending' THEN 0 WHEN status='approved' THEN 1 ELSE 2 END")
            ->orderByDesc('effective_date')
            ->paginate(15)
            ->through(function($c){
                return [
                    'id' => $c->id,
                    'change_type' => $c->change_type,
                    'amount' => $c->amount,
                    'currency' => $c->currency,
                    'effective_date' => optional($c->effective_date)->toDateString(),
                    'status' => $c->status,
                    'reason' => $c->reason,
                    'band' => $c->band ? [
                        'id' => $c->band->id,
                        'code' => $c->band->code,
                        'title' => $c->band->title,
                    ] : null,
                    'guard' => $c->guardRelation ? [
                        'id' => $c->guardRelation->id,
                        'name' => $c->guardRelation->name,
                        'employee_id' => $c->guardRelation->employee_id,
                    ] : null,
                ];
            })
            ->withQueryString();

        $guards = Guard::query()->where('status','active')->orderBy('name')->get(['id','name','employee_id']);

        return Inertia::render('HR/Compensation', [
            'bands' => $bands,
            'changes' => $changes,
            'guards' => $guards,
            'filters' => [ 'q' => $q, 'active' => $active, 'perPage' => $perPage ],
        ]);
    }

    public function storeBand(Request $request)
    {
        $data = $request->validate([
            'code' => ['required','string','max:50','unique:hr_salary_bands,code'],
            'title' => ['required','string','max:255'],
            'min_amount' => ['required','numeric','min:0'],
            'mid_amount' => ['required','numeric','min:0'],
            'max_amount' => ['required','numeric','min:0'],
            'currency' => ['required','string','max:8'],
            'active' => ['boolean'],
        ]);
        HrSalaryBand::create($data);
        return back()->with('success', 'Salary band created');
    }

    public function updateBand(Request $request, HrSalaryBand $band)
    {
        $data = $request->validate([
            'code' => ['required','string','max:50','unique:hr_salary_bands,code,'.$band->id],
            'title' => ['required','string','max:255'],
            'min_amount' => ['required','numeric','min:0'],
            'mid_amount' => ['required','numeric','min:0'],
            'max_amount' => ['required','numeric','min:0'],
            'currency' => ['required','string','max:8'],
            'active' => ['boolean'],
        ]);
        $band->update($data);
        return back()->with('success', 'Salary band updated');
    }

    public function destroyBand(HrSalaryBand $band)
    {
        $band->delete();
        return back()->with('success', 'Salary band deleted');
    }

    public function requestChange(Request $request)
    {
        $data = $request->validate([
            'guard_id' => ['required','exists:guards,id'],
            'hr_salary_band_id' => ['nullable','exists:hr_salary_bands,id'],
            'amount' => ['nullable','numeric'],
            'currency' => ['required','string','max:8'],
            'change_type' => ['required','in:adjustment,band_change'],
            'effective_date' => ['required','date'],
            'reason' => ['nullable','string'],
        ]);
        $data['status'] = 'pending';
        $data['created_by'] = optional($request->user())->id;
        $change = HrCompChange::create($data);

        // Notify approvers
        try {
            $recipients = User::permission('hr.compensation.approve')->get();
            if ($recipients->isEmpty()) {
                $recipients = User::role('super_admin')->get();
            }
            if ($recipients->isNotEmpty()) {
                $payload = [
                    'title' => 'Compensation change requested',
                    'message' => sprintf('Guard ID %d · Type: %s · Effective: %s', $data['guard_id'], $data['change_type'], $data['effective_date']),
                    'url' => route('hr.compensation.index'),
                ];
                Notification::send($recipients, new GenericDbNotification($payload));
            }
        } catch (\Throwable $e) { /* swallow */ }
        return back()->with('success', 'Compensation change requested');
    }

    public function approve(Request $request, HrCompChange $change)
    {
        $change->status = 'approved';
        $change->approved_by = optional($request->user())->id;
        $change->save();

        // Notify requester
        try {
            if ($change->creator) {
                $payload = [
                    'title' => 'Compensation change approved',
                    'message' => sprintf('Your request for Guard ID %d has been approved.', $change->guard_id),
                    'url' => route('hr.compensation.index'),
                ];
                $change->creator->notify(new GenericDbNotification($payload));
            }
        } catch (\Throwable $e) { /* swallow */ }
        return back()->with('success', 'Change approved');
    }

    public function decline(Request $request, HrCompChange $change)
    {
        $change->status = 'declined';
        $change->approved_by = optional($request->user())->id;
        $change->save();

        // Notify requester
        try {
            if ($change->creator) {
                $payload = [
                    'title' => 'Compensation change declined',
                    'message' => sprintf('Your request for Guard ID %d has been declined.', $change->guard_id),
                    'url' => route('hr.compensation.index'),
                ];
                $change->creator->notify(new GenericDbNotification($payload));
            }
        } catch (\Throwable $e) { /* swallow */ }
        return back()->with('success', 'Change declined');
    }

    public function changesExport(Request $request)
    {
        $filename = 'hr_compensation_changes_' . now()->format('Ymd_His') . '.csv';
        $rows = [];
        $rows[] = ['ID','Guard','Employee ID','Type','Band','Amount','Currency','Effective Date','Status','Requested By'];

        $items = HrCompChange::with(['guardRelation:id,name,employee_id','band:id,code,title','creator:id,name'])
            ->orderByDesc('created_at')
            ->get();

        foreach ($items as $c) {
            $rows[] = [
                $c->id,
                optional($c->guardRelation)->name,
                optional($c->guardRelation)->employee_id,
                $c->change_type,
                $c->band ? ($c->band->title ?: $c->band->code) : null,
                $c->amount,
                $c->currency,
                optional($c->effective_date)->toDateString(),
                $c->status,
                optional($c->creator)->name,
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
