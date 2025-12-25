<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobPosting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApplicantsController extends Controller
{
    public function index(Request $request)
    {
        $search = (string) $request->query('search', '');
        $status = (string) $request->query('status', '');
        $jobId = $request->query('job');
        $perPage = (int) ($request->query('per_page', 15));

        $query = JobApplication::query()->with('jobPosting:id,title');

        if ($status !== '') {
            $query->where('status', $status);
        }
        if (!empty($jobId)) {
            $query->where('job_posting_id', $jobId);
        }
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('candidate_name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%")
                  ->orWhere('phone', 'like', "%$search%")
                  ->orWhereHas('jobPosting', function ($qa) use ($search) {
                      $qa->where('title', 'like', "%$search%");
                  });
            });
        }

        $applications = $query->orderByDesc('created_at')
            ->paginate($perPage)
            ->through(function ($a) {
                return [
                    'id' => $a->id,
                    'candidate_name' => $a->candidate_name,
                    'email' => $a->email,
                    'phone' => $a->phone,
                    'status' => $a->status,
                    'created_at' => optional($a->created_at)->toDateTimeString(),
                    'job' => $a->jobPosting ? [
                        'id' => $a->jobPosting->id,
                        'title' => $a->jobPosting->title,
                    ] : null,
                ];
            })
            ->withQueryString();

        $jobs = JobPosting::orderBy('title')->get(['id','title']);

        return Inertia::render('HR/Applicants', [
            'applications' => $applications,
            'jobs' => $jobs,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'job' => $jobId,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function export(Request $request)
    {
        $search = (string) $request->query('search', '');
        $status = (string) $request->query('status', '');
        $jobId = $request->query('job');

        $query = JobApplication::query()->with('jobPosting:id,title');
        if ($status !== '') {
            $query->where('status', $status);
        }
        if (!empty($jobId)) {
            $query->where('job_posting_id', $jobId);
        }
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('candidate_name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%")
                  ->orWhere('phone', 'like', "%$search%")
                  ->orWhereHas('jobPosting', function ($qa) use ($search) {
                      $qa->where('title', 'like', "%$search%");
                  });
            });
        }

        $items = $query->orderByDesc('created_at')->get();

        $filename = 'hr_applicants_' . now()->format('Ymd_His') . '.csv';
        $rows = [];
        $rows[] = ['ID','Candidate','Email','Phone','Status','Job','Created At'];
        foreach ($items as $a) {
            $rows[] = [
                $a->id,
                $a->candidate_name,
                $a->email,
                $a->phone,
                $a->status,
                optional($a->jobPosting)->title,
                optional($a->created_at)->toDateTimeString(),
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
