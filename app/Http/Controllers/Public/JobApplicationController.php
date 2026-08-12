<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Models\JobPosting;
use App\Models\JobApplication;
use App\Models\User;
use App\Notifications\GenericDbNotification;
use App\Mail\JobApplicationReceived;
use App\Mail\JobApplicationInternalAlert;

class JobApplicationController extends Controller
{
    public function store(Request $request, JobPosting $jobPosting)
    {
        $validated = $request->validate([
            'candidate_name' => ['required','string','max:255'],
            'email' => ['required','email','max:255'],
            'phone' => ['nullable','string','max:50'],
            'resume' => ['nullable','file','mimes:pdf,doc,docx','max:5120'],
            'notes' => ['nullable','string','max:2000'],
            'website' => ['nullable','string','max:0'], // honeypot
        ]);

        $resumeUrl = null;
        if ($request->hasFile('resume')) {
            $path = $request->file('resume')->store('resumes', 'public');
            $resumeUrl = Storage::disk('public')->url($path);
        }

        $application = JobApplication::create([
            'job_posting_id' => $jobPosting->id,
            'candidate_name' => $validated['candidate_name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'status' => 'applied',
            'resume_url' => $resumeUrl,
            'notes' => $validated['notes'] ?? null,
        ]);

        try {
            if (!empty($application->email)) {
                $application->loadMissing('jobPosting:id,title');
                Mail::to($application->email)->send(new JobApplicationReceived($application));
            }
        } catch (\Throwable $e) {}

        try {
            if (!empty($jobPosting->apply_email)) {
                $application->loadMissing('jobPosting:id,title,apply_email');
                Mail::to($jobPosting->apply_email)->send(new JobApplicationInternalAlert($application));
            }
        } catch (\Throwable $e) {}

        // Internal notification to HR managers / super admins
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
        } catch (\Throwable $e) {}

        return back()->with('success', 'Thank you. Your application has been received.');
    }
}
