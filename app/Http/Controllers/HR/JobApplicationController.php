<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use Illuminate\Http\Request;

class JobApplicationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'job_posting_id' => ['required','integer','exists:job_postings,id'],
            'candidate_name' => ['required','string','max:255'],
            'email' => ['nullable','email','max:255'],
            'phone' => ['nullable','string','max:50'],
            'status' => ['nullable','in:applied,screening,interview,offered,hired,rejected'],
            'resume_url' => ['nullable','url','max:1000'],
            'notes' => ['nullable','string'],
        ]);

        $application = JobApplication::create([
            'job_posting_id' => $validated['job_posting_id'],
            'candidate_name' => $validated['candidate_name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'] ?? 'applied',
            'resume_url' => $validated['resume_url'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Application created');
    }

    public function update(Request $request, JobApplication $jobApplication)
    {
        $validated = $request->validate([
            'candidate_name' => ['sometimes','string','max:255'],
            'email' => ['nullable','email','max:255'],
            'phone' => ['nullable','string','max:50'],
            'status' => ['nullable','in:applied,screening,interview,offered,hired,rejected'],
            'resume_url' => ['nullable','url','max:1000'],
            'notes' => ['nullable','string'],
        ]);

        $jobApplication->update($validated);

        return back()->with('success', 'Application updated');
    }

    public function destroy(JobApplication $jobApplication)
    {
        $jobApplication->delete();
        return back()->with('success', 'Application deleted');
    }
}
