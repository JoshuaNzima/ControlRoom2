<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\HR\HrBenefit;
use App\Models\HR\HrBenefitEnrollment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HrBenefitController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('perPage', 15);
        $q = (string) $request->query('q', '');
        $category = (string) $request->query('category', '');
        $active = $request->query('active');

        $benefits = HrBenefit::withCount(['enrollments' => function($q){ $q->where('status','active'); }])
            ->when(strlen($q) > 0, function($qq) use ($q){
                $qq->where('name','like',"%$q%")
                   ->orWhere('code','like',"%$q%")
                   ->orWhere('description','like',"%$q%");
            })
            ->when(strlen($category) > 0, fn($qq) => $qq->where('category', $category))
            ->when($active !== null && $active !== '', function($qq) use ($active){
                $qq->where('active', filter_var($active, FILTER_VALIDATE_BOOLEAN));
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        $enrollments = HrBenefitEnrollment::with(['benefit:id,name,code','guardRelation:id,name,employee_id'])
            ->orderByDesc('created_at')
            ->paginate(15)
            ->through(function($en){
                return [
                    'id' => $en->id,
                    'status' => $en->status,
                    'start_date' => optional($en->start_date)->toDateString(),
                    'end_date' => optional($en->end_date)->toDateString(),
                    'benefit' => $en->benefit ? [
                        'id' => $en->benefit->id,
                        'name' => $en->benefit->name,
                        'code' => $en->benefit->code,
                    ] : null,
                    'guard' => $en->guardRelation ? [
                        'id' => $en->guardRelation->id,
                        'name' => $en->guardRelation->name,
                        'employee_id' => $en->guardRelation->employee_id,
                    ] : null,
                ];
            })
            ->withQueryString();

        $guards = Guard::query()->where('status','active')->orderBy('name')->get(['id','name','employee_id']);

        return Inertia::render('HR/Benefits', [
            'benefits' => $benefits,
            'enrollments' => $enrollments,
            'guards' => $guards,
            'filters' => [
                'q' => $q,
                'category' => $category,
                'active' => $active,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'code' => ['required','string','max:100','unique:hr_benefits,code'],
            'category' => ['nullable','string','max:100'],
            'active' => ['boolean'],
            'description' => ['nullable','string'],
            'start_date' => ['nullable','date'],
            'end_date' => ['nullable','date','after_or_equal:start_date'],
        ]);
        HrBenefit::create($data);
        return back()->with('success', 'Benefit created');
    }

    public function update(Request $request, HrBenefit $benefit)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'code' => ['required','string','max:100','unique:hr_benefits,code,'.$benefit->id],
            'category' => ['nullable','string','max:100'],
            'active' => ['boolean'],
            'description' => ['nullable','string'],
            'start_date' => ['nullable','date'],
            'end_date' => ['nullable','date','after_or_equal:start_date'],
        ]);
        $benefit->update($data);
        return back()->with('success', 'Benefit updated');
    }

    public function destroy(HrBenefit $benefit)
    {
        $benefit->delete();
        return back()->with('success', 'Benefit deleted');
    }

    public function enroll(Request $request, HrBenefit $benefit)
    {
        $data = $request->validate([
            'guard_id' => ['required','exists:guards,id'],
            'start_date' => ['nullable','date'],
        ]);
        $enrollment = HrBenefitEnrollment::create([
            'hr_benefit_id' => $benefit->id,
            'guard_id' => $data['guard_id'],
            'status' => 'active',
            'start_date' => $data['start_date'] ?? Carbon::today()->toDateString(),
            'created_by' => optional($request->user())->id,
        ]);
        return back()->with('success', 'Enrollment created');
    }

    public function cancelEnrollment(HrBenefitEnrollment $enrollment)
    {
        $enrollment->status = 'cancelled';
        $enrollment->end_date = Carbon::today();
        $enrollment->save();
        return back()->with('success', 'Enrollment cancelled');
    }

    public function enrollmentsExport(Request $request)
    {
        $filename = 'hr_benefit_enrollments_' . now()->format('Ymd_His') . '.csv';
        $rows = [];
        $rows[] = ['ID','Benefit','Code','Guard','Employee ID','Status','Start Date','End Date'];

        $items = HrBenefitEnrollment::with(['benefit:id,name,code','guardRelation:id,name,employee_id'])
            ->orderByDesc('created_at')
            ->get();

        foreach ($items as $en) {
            $rows[] = [
                $en->id,
                optional($en->benefit)->name,
                optional($en->benefit)->code,
                optional($en->guardRelation)->name,
                optional($en->guardRelation)->employee_id,
                $en->status,
                optional($en->start_date)->toDateString(),
                optional($en->end_date)->toDateString(),
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
