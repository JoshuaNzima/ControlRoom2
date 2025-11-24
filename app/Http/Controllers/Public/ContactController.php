<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use App\Models\ContactSubmission;
use App\Models\User;
use App\Notifications\NewContactSubmissionNotification;
use Inertia\Inertia;

class ContactController extends Controller
{
    public function index()
    {
        return Inertia::render('Public/Contact');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'company' => 'nullable|string|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|min:10',
            'service_interest' => 'nullable|in:security_guards,cctv_surveillance,mobile_patrol,event_security,consultation,integrated_systems,general',
            'budget' => 'nullable|in:under_5k,5k_10k,10k_25k,25k_50k,over_50k,discuss',
            'timeline' => 'nullable|in:asap,1_month,3_months,6_months,planning',
            'website' => 'nullable|string|max:0', // Honeypot field
        ]);

        // Check honeypot field - if filled, it's likely a bot
        if (!empty($validated['website'])) {
            // Silently fail for bots
            return back()->with('success', 'Thank you for your message. We will get back to you soon.');
        }

        $submission = ContactSubmission::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'company' => $validated['company'] ?? null,
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'service_interest' => $validated['service_interest'] ?? 'general',
            'budget' => $validated['budget'] ?? null,
            'timeline' => $validated['timeline'] ?? null,
            'status' => 'new',
            'ip_address' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
        ]);

        // Send notifications to relevant staff
        $targets = User::role(['admin', 'super_admin', 'sales_manager', 'control_room_operator'])->get();
        if ($targets->count() > 0) {
            Notification::send($targets, new NewContactSubmissionNotification($submission));
        }

        // Auto-reply to the submitter
        try {
            \Mail::to($validated['email'])->send(new \App\Mail\ContactAutoReply($submission));
        } catch (\Exception $e) {
            \Log::warning('Failed to send auto-reply email: ' . $e->getMessage());
        }

        return back()->with('success', 'Thank you for your message! We have received your inquiry and will respond within 24 hours.');
    }
}
