<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\Training\Refresher;
use App\Models\Training\RefresherTrainingRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrainerGuardsController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Guard::with(['grade', 'supervisor', 'sites.client', 'refresherTrainingRecords.refresher'])
            ->orderBy('name');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $guards = $query->paginate(20)->withQueryString();

        $refreshers = Refresher::where('status', 'active')
            ->orderBy('title')
            ->get(['id', 'title', 'duration_hours', 'validity_months']);

        $activeRefresherRecords = RefresherTrainingRecord::with('refresher')
            ->whereIn('guard_id', $guards->pluck('id'))
            ->whereIn('status', ['in_progress', 'completed'])
            ->get()
            ->groupBy('guard_id');

        return Inertia::render('Training/TrainerGuards/Index', [
            'guards' => $guards,
            'refreshers' => $refreshers,
            'activeRefresherRecords' => $activeRefresherRecords,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function addToRefresher(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => ['required', 'exists:guards,id'],
            'refresher_id' => ['required', 'exists:training_refreshers,id'],
            'training_date' => ['required', 'date'],
            'trainer_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $guard = Guard::findOrFail($validated['guard_id']);

        $existing = RefresherTrainingRecord::where('guard_id', $guard->id)
            ->where('refresher_id', $validated['refresher_id'])
            ->whereIn('status', ['in_progress', 'completed'])
            ->first();

        if ($existing) {
            return back()->with('error', 'Guard is already assigned to this refresher');
        }

        RefresherTrainingRecord::create([
            'guard_id' => $guard->id,
            'refresher_id' => $validated['refresher_id'],
            'trainer_id' => auth()->id(),
            'training_date' => $validated['training_date'],
            'trainer_notes' => $validated['trainer_notes'] ?? null,
            'status' => 'in_progress',
        ]);

        return back()->with('message', 'Guard added to refresher training');
    }

    public function evaluateRefresher(Request $request, RefresherTrainingRecord $record)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:passed,failed,promoted,dismissed'],
            'trainer_notes' => ['nullable', 'string', 'max:1000'],
            'dismissal_reason' => ['required_if:status,failed,dismissed', 'nullable', 'string', 'max:500'],
        ]);

        if (!in_array($record->status, ['in_progress', 'completed'])) {
            return back()->with('error', 'This refresher training has already been evaluated');
        }

        $record->update([
            'status' => $validated['status'],
            'trainer_notes' => $validated['trainer_notes'] ?? $record->trainer_notes,
            'dismissal_reason' => $validated['dismissal_reason'] ?? null,
            'completed_date' => now(),
            'evaluated_at' => now(),
            'evaluated_by' => auth()->id(),
        ]);

        if (in_array($validated['status'], ['failed', 'dismissed'])) {
            $guard = $record->guardRelation;
            $guard->update([
                'status' => 'terminated',
                'termination_reason' => 'Failed refresher training: ' . ($validated['dismissal_reason'] ?? 'Performance below standard'),
                'terminated_at' => now(),
            ]);
        }

        return back()->with('message', 'Refresher training evaluated successfully');
    }

    public function completeTraining(Request $request, RefresherTrainingRecord $record)
    {
        if ($record->status !== 'in_progress') {
            return back()->with('error', 'Training is not in progress');
        }

        $record->update([
            'status' => 'completed',
            'completed_date' => now(),
        ]);

        return back()->with('message', 'Training marked as completed. Ready for evaluation.');
    }

    public function getGuardDetails(Request $request, Guard $guard): JsonResponse
    {
        $guard->load(['grade', 'supervisor', 'sites.client']);

        // Get active infractions (last 3 months, not resolved)
        $infractions = $guard->getActiveInfractions()->map(fn($i) => [
            'id' => $i->id,
            'type' => $i->type,
            'description' => $i->description,
            'severity' => $i->severity,
            'status' => $i->status,
            'created_at' => $i->created_at,
        ]);

        // Calculate attendance KPI (last 30 days)
        $attendanceDays = $guard->attendance()
            ->whereDate('date', '>=', now()->subDays(30))
            ->whereNotNull('check_in_time')
            ->count();
        $attendanceRate = round(($attendanceDays / 30) * 100, 1);

        // Training completion rate
        $totalTraining = $guard->refresherTrainingRecords()->count();
        $completedTraining = $guard->refresherTrainingRecords()
            ->whereIn('status', ['completed', 'passed', 'promoted'])
            ->count();
        $trainingRate = $totalTraining > 0 ? round(($completedTraining / $totalTraining) * 100, 1) : 0;

        // Days since last infraction
        $daysSinceInfraction = $guard->last_infraction_at 
            ? $guard->last_infraction_at->diffInDays(now()) 
            : null;

        $refresherHistory = RefresherTrainingRecord::with(['refresher', 'trainer', 'evaluator'])
            ->where('guard_id', $guard->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'status' => $r->status,
                'training_date' => $r->training_date,
                'completed_date' => $r->completed_date,
                'trainer_notes' => $r->trainer_notes,
                'refresher' => [
                    'id' => $r->refresher->id,
                    'title' => $r->refresher->title,
                    'duration_hours' => $r->refresher->duration_hours,
                ],
                'trainer' => $r->trainer?->name,
                'evaluated_at' => $r->evaluated_at,
            ]);

        return response()->json([
            'success' => true,
            'guard' => [
                'id' => $guard->id,
                'name' => $guard->name,
                'employee_id' => $guard->employee_id,
                'phone' => $guard->phone,
                'email' => $guard->email,
                'status' => $guard->status,
                'photo_url' => $guard->photo_url,
                'grade' => $guard->grade?->only(['id', 'code', 'name']),
                'supervisor' => $guard->supervisor?->only(['id', 'name']),
                'sites' => $guard->sites->map(fn($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'client' => $s->client?->only(['id', 'name']),
                ]),
                'hire_date' => $guard->hire_date,
                'years_of_service' => $guard->hire_date ? $guard->hire_date->diffInYears(now()) : null,
            ],
            'kpis' => [
                'attendance_rate' => $attendanceRate,
                'attendance_days' => $attendanceDays,
                'infraction_count' => $guard->infraction_count ?? 0,
                'risk_level' => $guard->risk_level ?? 'normal',
                'days_since_infraction' => $daysSinceInfraction,
                'training_completion_rate' => $trainingRate,
                'total_trainings' => $totalTraining,
                'completed_trainings' => $completedTraining,
            ],
            'infractions' => $infractions,
            'refresher_history' => $refresherHistory,
        ]);
    }

    public function show(Request $request, Guard $guard): Response
    {
        $guard->load(['grade', 'supervisor', 'sites.client']);

        $refresherHistory = RefresherTrainingRecord::with(['refresher', 'trainer', 'evaluator'])
            ->where('guard_id', $guard->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Training/TrainerGuards/Show', [
            'guard' => $guard,
            'refresherHistory' => $refresherHistory,
        ]);
    }
}
