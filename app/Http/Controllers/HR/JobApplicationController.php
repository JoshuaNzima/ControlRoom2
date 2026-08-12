<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use App\Models\User;
use App\Notifications\GenericDbNotification;
use Illuminate\Support\Facades\Mail;
use App\Mail\JobApplicationReceived;
use App\Mail\JobApplicationInternalAlert;
use App\Mail\JobApplicationStatusUpdated;

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

        if (!empty($application->email)) {
            try {
                $application->loadMissing('jobPosting:id,title');
                Mail::to($application->email)->send(new JobApplicationReceived($application));
            } catch (\Throwable $e) {
            }
        }

        try {
            $application->loadMissing('jobPosting:id,title,apply_email');
            if (!empty($application->jobPosting?->apply_email)) {
                Mail::to($application->jobPosting->apply_email)->send(new JobApplicationInternalAlert($application));
            }
        } catch (\Throwable $e) {
        }

        try {
            $recipients = User::permission('hr.careers.manage')->get();
            if ($recipients->isEmpty()) {
                $recipients = User::role('super_admin')->get();
            }
            if ($recipients->isNotEmpty()) {
                $application->loadMissing('jobPosting:id,title');
                $payload = [
                    'title' => 'New Job Application',
                    'message' => sprintf('%s applied%s', $application->candidate_name ?? 'Candidate', $application->jobPosting ? ' for '.$application->jobPosting->title : ''),
                    'url' => route('hr.jobs.applicants'),
                    'mail' => true,
                ];
                Notification::send($recipients, new GenericDbNotification($payload));
            }
        } catch (\Throwable $e) {
        }

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

        $oldStatus = (string) $jobApplication->status;

        $jobApplication->update($validated);

        try {
            $newStatus = (string) $jobApplication->status;
            if (!empty($validated['status']) && $oldStatus !== $newStatus && !empty($jobApplication->email)) {
                $jobApplication->loadMissing('jobPosting:id,title');
                Mail::to($jobApplication->email)->send(new JobApplicationStatusUpdated($jobApplication, $oldStatus));
            }
        } catch (\Throwable $e) {
        }

        return back()->with('success', 'Application updated');
    }

    public function destroy(JobApplication $jobApplication)
    {
        $jobApplication->delete();
        return back()->with('success', 'Application deleted');
    }
}
