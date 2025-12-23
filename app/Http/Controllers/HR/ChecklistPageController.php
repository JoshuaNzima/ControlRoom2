<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\ChecklistTemplate;
use App\Models\HR\GuardChecklist;
use App\Models\Guards\Guard;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChecklistPageController extends Controller
{
    public function index(Request $request)
    {
        // Authorization is enforced via route middleware 'permission:hr.employees.manage'

        $templates = ChecklistTemplate::with(['items' => function ($q) {
            $q->orderBy('sort_order');
        }])->orderBy('name')->get();

        $assignments = GuardChecklist::with(['guard:id,name,employee_id', 'items:id,guard_checklist_id,title,status'])
            ->orderByDesc('created_at')
            ->limit(25)
            ->get()
            ->map(function ($c) {
                $total = $c->items->count();
                $done = $c->items->where('status', 'done')->count();
                return [
                    'id' => $c->id,
                    'type' => $c->type,
                    'status' => $c->status,
                    'start_date' => optional($c->start_date)->toDateString(),
                    'due_date' => optional($c->due_date)->toDateString(),
                    'completed_at' => optional($c->completed_at)->toDateTimeString(),
                    'guard' => $c->guard ? [
                        'id' => $c->guard->id,
                        'name' => $c->guard->name,
                        'employee_id' => $c->guard->employee_id,
                    ] : null,
                    'progress' => [
                        'done' => $done,
                        'total' => $total,
                    ],
                    'items' => $c->items->map(function($i){
                        return [
                            'id' => $i->id,
                            'title' => $i->title,
                            'status' => $i->status,
                        ];
                    }),
                ];
            });

        $guards = Guard::query()->where('status', 'active')->orderBy('name')->get(['id','name','employee_id']);

        $type = (string) $request->query('type', '');
        $status = (string) $request->query('status', '');
        $guardId = $request->query('guard_id');
        $q = (string) $request->query('q', '');
        $due = (string) $request->query('due', '');
        $sort = (string) $request->query('sort', 'created_desc');
        $perPage = (int) $request->query('perPage', 10);

        $today = Carbon::today();
        $in7 = $today->copy()->addDays(7);

        $trackerQuery = GuardChecklist::query()
            ->with(['guard:id,name,employee_id', 'items:id,guard_checklist_id,title,status,due_date'])
            ->when(in_array($type, ['onboarding','offboarding']), function($qq) use ($type){ $qq->where('type', $type); })
            ->when(in_array($status, ['active','completed']), function($qq) use ($status){ $qq->where('status', $status); })
            ->when($guardId, function($qq) use ($guardId){ $qq->where('guard_id', $guardId); })
            ->when(strlen($q) > 0, function($qq) use ($q){
                $qq->whereHas('guard', function($gq) use ($q){
                    $gq->where('name', 'like', "%$q%")
                       ->orWhere('employee_id', 'like', "%$q%");
                });
            })
            ->when($due === 'overdue', function($qq) use ($today){
                $qq->whereHas('items', function($iq) use ($today){
                    $iq->where('status','pending')->whereDate('due_date','<', $today->toDateString());
                });
            })
            ->when($due === 'due_7d', function($qq) use ($today, $in7){
                $qq->whereHas('items', function($iq) use ($today, $in7){
                    $iq->where('status','pending')->whereBetween('due_date', [$today->toDateString(), $in7->toDateString()]);
                });
            });

        if ($sort === 'due_asc') {
            $trackerQuery->orderBy('due_date')->orderByDesc('created_at');
        } elseif ($sort === 'due_desc') {
            $trackerQuery->orderByDesc('due_date')->orderByDesc('created_at');
        } else {
            $trackerQuery->orderByDesc('created_at');
        }

        $tracker = $trackerQuery->paginate($perPage)->withQueryString();
        $tracker->getCollection()->transform(function($c){
            $total = $c->items->count();
            $done = $c->items->where('status', 'done')->count();
            return [
                'id' => $c->id,
                'type' => $c->type,
                'status' => $c->status,
                'start_date' => optional($c->start_date)->toDateString(),
                'due_date' => optional($c->due_date)->toDateString(),
                'completed_at' => optional($c->completed_at)->toDateTimeString(),
                'guard' => $c->guard ? [
                    'id' => $c->guard->id,
                    'name' => $c->guard->name,
                    'employee_id' => $c->guard->employee_id,
                ] : null,
                'progress' => [
                    'done' => $done,
                    'total' => $total,
                ],
                'items' => $c->items->map(function($i){
                    return [
                        'id' => $i->id,
                        'title' => $i->title,
                        'status' => $i->status,
                        'due_date' => optional($i->due_date)->toDateString(),
                    ];
                }),
            ];
        });

        $filters = [
            'type' => $type,
            'status' => $status,
            'guard_id' => $guardId,
            'q' => $q,
            'due' => $due,
            'sort' => $sort,
            'perPage' => $perPage,
        ];

        return Inertia::render('HR/Checklists', [
            'templates' => $templates,
            'assignments' => $assignments,
            'guards' => $guards,
            'filters' => $filters,
            'tracker' => $tracker,
        ]);
    }
}
