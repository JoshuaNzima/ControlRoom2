<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\HR\HrDisciplinaryCase;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DisciplinaryController extends Controller
{
    public function index(Request $request)
    {
        // Managed via route middleware 'permission:hr.employees.manage'
        $perPage = (int) $request->query('perPage', 15);
        $q = (string) $request->query('q', '');
        $status = (string) $request->query('status', ''); // open|closed|any
        $type = (string) $request->query('type', '');
        $guardId = $request->query('guard_id');

        $cases = HrDisciplinaryCase::with(['guard:id,name,employee_id'])
            ->when(strlen($q) > 0, function($qq) use ($q){
                $qq->where(function($cq) use ($q){
                    $cq->where('case_no', 'like', "%$q%")
                       ->orWhere('description', 'like', "%$q%")
                       ->orWhere('type', 'like', "%$q%");
                })->orWhereHas('guard', function($gq) use ($q){
                    $gq->where('name', 'like', "%$q%")
                       ->orWhere('employee_id', 'like', "%$q%");
                });
            })
            ->when(in_array($status, ['open','closed']), fn($qq) => $qq->where('status', $status))
            ->when(strlen($type) > 0, fn($qq) => $qq->where('type', 'like', "%$type%"))
            ->when($guardId, fn($qq) => $qq->where('guard_id', $guardId))
            ->orderByRaw("CASE WHEN status='open' THEN 0 ELSE 1 END")
            ->orderByDesc('opened_at')
            ->paginate($perPage)
            ->withQueryString();

        $guards = Guard::query()->where('status', 'active')->orderBy('name')->get(['id','name','employee_id']);

        // Simple stats
        $openCount = HrDisciplinaryCase::where('status','open')->count();
        $closedCount = HrDisciplinaryCase::where('status','closed')->count();

        return Inertia::render('HR/Disciplinary', [
            'cases' => $cases,
            'guards' => $guards,
            'stats' => [
                'open' => $openCount,
                'closed' => $closedCount,
            ],
            'filters' => [
                'q' => $q,
                'status' => $status,
                'type' => $type,
                'guard_id' => $guardId,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'guard_id' => ['required','exists:guards,id'],
            'type' => ['required','string','max:100'],
            'description' => ['nullable','string'],
            'opened_at' => ['nullable','date'],
        ]);
        $now = Carbon::now();
        $caseNo = 'DC-'. $now->format('YmdHis') . '-' . random_int(100, 999);
        $data['case_no'] = $caseNo;
        $data['status'] = 'open';
        $data['opened_at'] = $data['opened_at'] ?? $now;
        $data['created_by'] = optional($request->user())->id;

        HrDisciplinaryCase::create($data);
        return back()->with('success', 'Disciplinary case created');
    }

    public function update(Request $request, HrDisciplinaryCase $case)
    {
        $data = $request->validate([
            'type' => ['required','string','max:100'],
            'status' => ['required','in:open,closed'],
            'stage' => ['nullable','string','max:100'],
            'description' => ['nullable','string'],
            'next_hearing_at' => ['nullable','date'],
        ]);
        $case->update($data);
        return back()->with('success', 'Case updated');
    }

    public function schedule(Request $request, HrDisciplinaryCase $case)
    {
        $data = $request->validate([
            'next_hearing_at' => ['required','date'],
            'stage' => ['nullable','string','max:100'],
        ]);
        $case->next_hearing_at = Carbon::parse($data['next_hearing_at']);
        if (!empty($data['stage'])) {
            $case->stage = $data['stage'];
        }
        $case->save();
        return back()->with('success', 'Hearing scheduled');
    }

    public function outcome(Request $request, HrDisciplinaryCase $case)
    {
        $data = $request->validate([
            'outcome_type' => ['required','string','max:100'],
            'outcome' => ['nullable','string'],
            'corrective_actions' => ['nullable','string'],
        ]);
        $case->update($data);
        return back()->with('success', 'Outcome recorded');
    }

    public function close(Request $request, HrDisciplinaryCase $case)
    {
        $case->status = 'closed';
        $case->closed_at = Carbon::now();
        $case->save();
        return back()->with('success', 'Case closed');
    }
}
