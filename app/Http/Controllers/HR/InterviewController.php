<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Interview;
use Illuminate\Http\Request;

class InterviewController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'job_application_id' => ['required','integer','exists:job_applications,id'],
            'scheduled_at' => ['required','date'],
            'interviewer_id' => ['nullable','integer','exists:users,id'],
            'mode' => ['nullable','in:in_person,phone,video'],
            'location_or_link' => ['nullable','string','max:1000'],
            'notes' => ['nullable','string'],
        ]);

        Interview::create([
            'job_application_id' => $validated['job_application_id'],
            'scheduled_at' => $validated['scheduled_at'],
            'interviewer_id' => $validated['interviewer_id'] ?? null,
            'mode' => $validated['mode'] ?? 'in_person',
            'location_or_link' => $validated['location_or_link'] ?? null,
            'status' => 'scheduled',
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Interview scheduled');
    }

    public function update(Request $request, Interview $interview)
    {
        $validated = $request->validate([
            'scheduled_at' => ['sometimes','date'],
            'interviewer_id' => ['nullable','integer','exists:users,id'],
            'mode' => ['nullable','in:in_person,phone,video'],
            'location_or_link' => ['nullable','string','max:1000'],
            'status' => ['nullable','in:scheduled,done,no_show,canceled'],
            'notes' => ['nullable','string'],
        ]);

        $interview->update($validated);

        return back()->with('success', 'Interview updated');
    }

    public function destroy(Interview $interview)
    {
        $interview->delete();
        return back()->with('success', 'Interview deleted');
    }
}
