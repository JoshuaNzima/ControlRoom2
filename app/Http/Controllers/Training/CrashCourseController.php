<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\Training\CrashCourse;
use App\Models\Training\Trainee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CrashCourseController extends Controller
{
    public function index(Request $request): Response
    {
        $courses = CrashCourse::withCount('trainees')
            ->when($request->input('status'), function ($q, $status) {
                $q->where('status', $status);
            })
            ->orderBy('title')
            ->paginate(20)
            ->withQueryString();

        // Add pending approval count for each course
        foreach ($courses as $course) {
            $course->pending_approval_count = $course->trainees()
                ->whereRaw('training_crash_course_trainee.status = ?', ['completed'])
                ->whereRaw('training_crash_course_trainee.approval_status = ?', ['pending'])
                ->count();
        }

        $trainees = Trainee::whereIn('status', ['in_training', 'pending', 'completed'])
            ->orderBy('name')
            ->get(['id', 'name', 'status']);

        return Inertia::render('Training/CrashCourses/Index', [
            'courses' => $courses,
            'trainees' => $trainees,
            'filters' => $request->only(['status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:72'],
        ]);

        $validated['created_by'] = auth()->id();
        $validated['status'] = 'active';

        CrashCourse::create($validated);

        return back()->with('message', 'Crash course created successfully');
    }

    public function update(Request $request, CrashCourse $crashCourse)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:72'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $crashCourse->update($validated);

        return back()->with('message', 'Crash course updated successfully');
    }

    public function destroy(CrashCourse $crashCourse)
    {
        $crashCourse->delete();
        return back()->with('message', 'Crash course deleted successfully');
    }

    public function enroll(Request $request, CrashCourse $crashCourse)
    {
        $validated = $request->validate([
            'trainee_ids' => ['required', 'array', 'min:1'],
            'trainee_ids.*' => ['exists:training_trainees,id'],
        ]);

        $enrolled = [];
        $existing = [];

        foreach ($validated['trainee_ids'] as $traineeId) {
            if ($crashCourse->trainees()->where('trainee_id', $traineeId)->exists()) {
                $existing[] = $traineeId;
                continue;
            }

            $crashCourse->trainees()->attach($traineeId, [
                'enrolled_at' => now(),
                'status' => 'enrolled',
                'trained_by' => auth()->id(),
            ]);
            $enrolled[] = $traineeId;
        }

        return back()->with('message', count($enrolled) . ' trainee(s) enrolled successfully');
    }

    public function updateEnrollment(Request $request, CrashCourse $crashCourse, Trainee $trainee)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:enrolled,in_progress,completed,dropped'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $pivotData = [
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
        ];

        if ($validated['status'] === 'completed' && !$crashCourse->trainees()->where('trainee_id', $trainee->id)->whereNotNull('completed_at')->exists()) {
            $pivotData['completed_at'] = now();
        }

        $crashCourse->trainees()->updateExistingPivot($trainee->id, $pivotData);

        return back()->with('message', 'Enrollment updated successfully');
    }

    public function removeEnrollment(CrashCourse $crashCourse, Trainee $trainee)
    {
        $crashCourse->trainees()->detach($trainee->id);
        return back()->with('message', 'Trainee removed from course');
    }

    public function show(CrashCourse $crashCourse): Response
    {
        $course = $crashCourse->load(['trainees' => function ($q) {
            $q->orderBy('name');
        }, 'trainees.approver:id,name', 'creator:id,name']);

        $availableTrainees = Trainee::whereIn('status', ['in_training', 'pending'])
            ->whereNotIn('id', $course->trainees->pluck('id'))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Training/CrashCourses/Show', [
            'course' => $course,
            'availableTrainees' => $availableTrainees,
        ]);
    }

    public function approveEnrollment(Request $request, CrashCourse $crashCourse, Trainee $trainee)
    {
        $pivot = $crashCourse->trainees()->where('trainee_id', $trainee->id)->first();

        if (!$pivot) {
            return back()->with('error', 'Trainee not enrolled in this course');
        }

        if ($pivot->pivot->approval_status !== 'pending') {
            return back()->with('error', 'This enrollment has already been processed');
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $crashCourse->trainees()->updateExistingPivot($trainee->id, [
            'approval_status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'notes' => $validated['notes'] ?? $pivot->pivot->notes,
        ]);

        // Update trainee status to completed if approved after crash course
        if ($pivot->pivot->status === 'completed') {
            $trainee->update(['status' => 'completed']);
        }

        return back()->with('message', 'Enrollment approved successfully');
    }

    public function rejectEnrollment(Request $request, CrashCourse $crashCourse, Trainee $trainee)
    {
        $pivot = $crashCourse->trainees()->where('trainee_id', $trainee->id)->first();

        if (!$pivot) {
            return back()->with('error', 'Trainee not enrolled in this course');
        }

        if ($pivot->pivot->approval_status !== 'pending') {
            return back()->with('error', 'This enrollment has already been processed');
        }

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $crashCourse->trainees()->updateExistingPivot($trainee->id, [
            'approval_status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return back()->with('message', 'Enrollment rejected');
    }
}
