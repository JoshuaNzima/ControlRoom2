<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\JobPosting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class JobPostingController extends Controller
{
    public function index(Request $request)
    {
        $query = JobPosting::query()
            ->when($request->get('status'), fn($q, $s) => $q->where('status', $s))
            ->when($request->get('search'), function ($q, $s) {
                $q->where(function ($qq) use ($s) {
                    $qq->where('title', 'like', "%{$s}%")
                       ->orWhere('location', 'like', "%{$s}%");
                });
            })
            ->latest('posted_at')
            ->latest();

        $jobs = $query->paginate(15)->appends($request->query());

        return Inertia::render('HR/Jobs', [
            'jobs' => $jobs,
            'filters' => [
                'status' => $request->get('status'),
                'search' => $request->get('search'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'type' => 'required|string|max:50',
            'status' => 'required|in:draft,published',
            'apply_email' => 'nullable|email|max:255',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
        ]);

        $data['created_by'] = Auth::id();
        $data['posted_at'] = $data['status'] === 'published' ? now() : null;

        JobPosting::create($data);

        return back()->with('success', 'Job posting created.');
    }

    public function update(Request $request, JobPosting $jobPosting)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'type' => 'required|string|max:50',
            'status' => 'required|in:draft,published',
            'apply_email' => 'nullable|email|max:255',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
        ]);

        if ($jobPosting->status !== 'published' && $data['status'] === 'published' && !$jobPosting->posted_at) {
            $data['posted_at'] = now();
        }
        if ($data['status'] === 'draft') {
            $data['posted_at'] = null;
        }

        $jobPosting->update($data);

        return back()->with('success', 'Job posting updated.');
    }

    public function destroy(JobPosting $jobPosting)
    {
        $jobPosting->delete();
        return back()->with('success', 'Job posting deleted.');
    }

    public function publish(JobPosting $jobPosting)
    {
        $jobPosting->update([
            'status' => 'published',
            'posted_at' => now(),
        ]);
        return back()->with('success', 'Job posting published.');
    }

    public function unpublish(JobPosting $jobPosting)
    {
        $jobPosting->update([
            'status' => 'draft',
            'posted_at' => null,
        ]);
        return back()->with('success', 'Job posting moved to draft.');
    }

    public function export(Request $request)
    {
        $query = JobPosting::query()
            ->when($request->get('status'), fn($q, $s) => $q->where('status', $s))
            ->when($request->get('search'), function ($q, $s) {
                $q->where(function ($qq) use ($s) {
                    $qq->where('title', 'like', "%{$s}%")
                       ->orWhere('location', 'like', "%{$s}%");
                });
            })
            ->latest('posted_at')
            ->latest();

        $items = $query->get(['id','title','location','type','status','posted_at','apply_email']);

        $filename = 'hr_jobs_' . now()->format('Ymd_His') . '.csv';
        $rows = [];
        $rows[] = ['ID','Title','Location','Type','Status','Posted At','Apply Email'];
        foreach ($items as $it) {
            $rows[] = [
                $it->id,
                $it->title,
                $it->location,
                $it->type,
                $it->status,
                optional($it->posted_at)->toDateTimeString(),
                $it->apply_email,
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
