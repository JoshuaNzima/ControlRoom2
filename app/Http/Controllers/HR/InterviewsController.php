<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Interview;
use App\Models\JobApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class InterviewsController extends Controller
{
    public function index(Request $request)
    {
        $status = (string) $request->query('status', '');
        $from = $request->query('from');
        $to = $request->query('to');
        $perPage = (int) ($request->query('per_page', 15));

        $query = Interview::query()->with(['application:id,job_posting_id,candidate_name,status','application.jobPosting:id,title']);

        if ($status !== '') {
            $query->where('status', $status);
        }
        if (!empty($from)) {
            $query->where('scheduled_at', '>=', Carbon::parse($from)->startOfDay());
        }
        if (!empty($to)) {
            $query->where('scheduled_at', '<=', Carbon::parse($to)->endOfDay());
        }

        $interviews = $query->orderBy('scheduled_at', 'desc')
            ->paginate($perPage)
            ->through(function ($iv) {
                return [
                    'id' => $iv->id,
                    'scheduled_at' => optional($iv->scheduled_at)->toDateTimeString(),
                    'mode' => $iv->mode,
                    'location_or_link' => $iv->location_or_link,
                    'status' => $iv->status,
                    'candidate' => $iv->application ? [
                        'id' => $iv->application->id,
                        'name' => $iv->application->candidate_name,
                        'status' => $iv->application->status,
                        'job' => $iv->application->jobPosting ? [
                            'id' => $iv->application->jobPosting->id,
                            'title' => $iv->application->jobPosting->title,
                        ] : null,
                    ] : null,
                ];
            })
            ->withQueryString();

        // Applications for scheduling selector
        $applications = JobApplication::with('jobPosting:id,title')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get(['id','job_posting_id','candidate_name','status'])
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'candidate_name' => $a->candidate_name,
                    'status' => $a->status,
                    'job' => $a->jobPosting ? [
                        'id' => $a->jobPosting->id,
                        'title' => $a->jobPosting->title,
                    ] : null,
                ];
            });

        return Inertia::render('HR/Interviews', [
            'interviews' => $interviews,
            'applications' => $applications,
            'filters' => [
                'status' => $status,
                'from' => $from,
                'to' => $to,
                'per_page' => $perPage,
            ],
        ]);
    }
}
