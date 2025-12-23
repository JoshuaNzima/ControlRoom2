<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\HR\HrTrainingCourse;
use App\Models\HR\HrTrainingSession;
use App\Models\HR\HrTrainingEnrollment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TrainingController extends Controller
{
    public function index(Request $request)
    {
        $q = (string) $request->query('q', '');
        $courseId = (int) $request->query('course_id', 0);
        $perPage = (int) $request->query('perPage', 15);

        $courses = HrTrainingCourse::query()
            ->when(strlen($q) > 0, function($qq) use ($q){
                $qq->where('title','like',"%$q%")
                   ->orWhere('code','like',"%$q%")
                   ->orWhere('category','like',"%$q%");
            })
            ->orderBy('title')
            ->paginate($perPage)
            ->through(function($c){
                return [
                    'id' => $c->id,
                    'title' => $c->title,
                    'code' => $c->code,
                    'category' => $c->category,
                    'active' => (bool) $c->active,
                    'description' => $c->description,
                    'sessions_count' => $c->sessions()->count(),
                    'enrollments_count' => $c->enrollments()->count(),
                ];
            })
            ->withQueryString();

        if ($courseId === 0 && $courses->count() > 0) {
            $courseId = (int) ($courses->first()['id'] ?? 0);
        }

        $sessions = HrTrainingSession::query()
            ->when($courseId > 0, fn($qq) => $qq->where('hr_training_course_id', $courseId))
            ->orderBy('start_at', 'desc')
            ->paginate(10)
            ->through(function($s){
                return [
                    'id' => $s->id,
                    'hr_training_course_id' => $s->hr_training_course_id,
                    'title' => $s->title,
                    'mode' => $s->mode,
                    'location_or_link' => $s->location_or_link,
                    'start_at' => optional($s->start_at)->toDateTimeString(),
                    'end_at' => optional($s->end_at)->toDateTimeString(),
                    'capacity' => $s->capacity,
                    'trainer_name' => $s->trainer_name,
                ];
            })
            ->withQueryString();

        $enrollments = HrTrainingEnrollment::with(['guardRelation:id,name,employee_id','course:id,title','session:id,title,start_at'])
            ->when($courseId > 0, fn($qq) => $qq->where('hr_training_course_id', $courseId))
            ->orderByDesc('created_at')
            ->paginate(10)
            ->through(function($e){
                return [
                    'id' => $e->id,
                    'status' => $e->status,
                    'completed_at' => optional($e->completed_at)->toDateTimeString(),
                    'guard' => $e->guardRelation ? [
                        'id' => $e->guardRelation->id,
                        'name' => $e->guardRelation->name,
                        'employee_id' => $e->guardRelation->employee_id,
                    ] : null,
                    'course' => $e->course ? [ 'id' => $e->course->id, 'title' => $e->course->title ] : null,
                    'session' => $e->session ? [ 'id' => $e->session->id, 'title' => $e->session->title, 'start_at' => optional($e->session->start_at)->toDateTimeString() ] : null,
                ];
            })
            ->withQueryString();

        $guards = Guard::query()->where('status','active')->orderBy('name')->get(['id','name','employee_id']);

        return Inertia::render('HR/Training', [
            'courses' => $courses,
            'sessions' => $sessions,
            'enrollments' => $enrollments,
            'guards' => $guards,
            'filters' => [ 'q' => $q, 'perPage' => $perPage, 'course_id' => $courseId ],
        ]);
    }

    public function storeCourse(Request $request)
    {
        $data = $request->validate([
            'title' => ['required','string','max:255'],
            'code' => ['nullable','string','max:50'],
            'category' => ['nullable','string','max:100'],
            'active' => ['boolean'],
            'description' => ['nullable','string'],
        ]);
        $data['created_by'] = optional($request->user())->id;
        HrTrainingCourse::create($data);
        return back()->with('success', 'Course created');
    }

    public function updateCourse(Request $request, HrTrainingCourse $course)
    {
        $data = $request->validate([
            'title' => ['required','string','max:255'],
            'code' => ['nullable','string','max:50'],
            'category' => ['nullable','string','max:100'],
            'active' => ['boolean'],
            'description' => ['nullable','string'],
        ]);
        $course->update($data);
        return back()->with('success', 'Course updated');
    }

    public function destroyCourse(HrTrainingCourse $course)
    {
        $course->delete();
        return back()->with('success', 'Course removed');
    }

    public function storeSession(Request $request)
    {
        $data = $request->validate([
            'hr_training_course_id' => ['required','exists:hr_training_courses,id'],
            'title' => ['nullable','string','max:255'],
            'mode' => ['required','in:in_person,video,phone'],
            'location_or_link' => ['nullable','string','max:255'],
            'start_at' => ['required','date'],
            'end_at' => ['nullable','date','after_or_equal:start_at'],
            'capacity' => ['nullable','integer','min:1'],
            'trainer_name' => ['nullable','string','max:255'],
        ]);
        $data['created_by'] = optional($request->user())->id;
        HrTrainingSession::create($data);
        return back()->with('success', 'Session created');
    }

    public function updateSession(Request $request, HrTrainingSession $session)
    {
        $data = $request->validate([
            'title' => ['nullable','string','max:255'],
            'mode' => ['required','in:in_person,video,phone'],
            'location_or_link' => ['nullable','string','max:255'],
            'start_at' => ['required','date'],
            'end_at' => ['nullable','date','after_or_equal:start_at'],
            'capacity' => ['nullable','integer','min:1'],
            'trainer_name' => ['nullable','string','max:255'],
        ]);
        $session->update($data);
        return back()->with('success', 'Session updated');
    }

    public function destroySession(HrTrainingSession $session)
    {
        $session->delete();
        return back()->with('success', 'Session removed');
    }

    public function enroll(Request $request)
    {
        $data = $request->validate([
            'hr_training_course_id' => ['required','exists:hr_training_courses,id'],
            'hr_training_session_id' => ['nullable','exists:hr_training_sessions,id'],
            'guard_id' => ['required','exists:guards,id'],
        ]);
        $data['status'] = 'enrolled';
        $data['created_by'] = optional($request->user())->id;
        HrTrainingEnrollment::create($data);
        return back()->with('success', 'Enrollment created');
    }

    public function completeEnrollment(HrTrainingEnrollment $enrollment)
    {
        $enrollment->status = 'completed';
        $enrollment->completed_at = Carbon::now();
        $enrollment->save();
        return back()->with('success', 'Enrollment marked complete');
    }

    public function cancelEnrollment(HrTrainingEnrollment $enrollment)
    {
        $enrollment->status = 'cancelled';
        $enrollment->save();
        return back()->with('success', 'Enrollment cancelled');
    }
}
