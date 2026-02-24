<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\Training\Refresher;
use App\Models\Training\Trainee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class RefresherController extends Controller
{
    public function index(Request $request): Response
    {
        $refreshers = Refresher::withCount(['trainees' => function ($q) {
            $q->whereRaw('training_refresher_trainee.expires_at > ?', [now()]);
        }])
            ->when($request->input('status'), function ($q, $status) {
                $q->where('status', $status);
            })
            ->orderBy('title')
            ->paginate(20)
            ->withQueryString();

        $trainees = Trainee::whereIn('status', ['in_training', 'pending', 'completed', 'hired'])
            ->orderBy('name')
            ->get(['id', 'name', 'status']);

        return Inertia::render('Training/Refreshers/Index', [
            'refreshers' => $refreshers,
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
            'validity_months' => ['required', 'integer', 'min:1', 'max:60'],
        ]);

        $validated['created_by'] = auth()->id();
        $validated['status'] = 'active';

        Refresher::create($validated);

        return back()->with('message', 'Refresher created successfully');
    }

    public function update(Request $request, Refresher $refresher)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:72'],
            'validity_months' => ['required', 'integer', 'min:1', 'max:60'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $refresher->update($validated);

        return back()->with('message', 'Refresher updated successfully');
    }

    public function destroy(Refresher $refresher)
    {
        $refresher->delete();
        return back()->with('message', 'Refresher deleted successfully');
    }

    public function recordCompletion(Request $request, Refresher $refresher)
    {
        $validated = $request->validate([
            'trainee_ids' => ['required', 'array', 'min:1'],
            'trainee_ids.*' => ['exists:training_trainees,id'],
            'completed_at' => ['required', 'date'],
        ]);

        $completedAt = Carbon::parse($validated['completed_at']);
        $expiresAt = $refresher->calculateExpiryDate($completedAt);

        $recorded = [];
        $existing = [];

        foreach ($validated['trainee_ids'] as $traineeId) {
            // Check if trainee already has an active refresher
            $existingRecord = $refresher->trainees()
                ->where('trainee_id', $traineeId)
                ->where('expires_at', '>', now())
                ->first();

            if ($existingRecord) {
                $existing[] = $traineeId;
                continue;
            }

            $refresher->trainees()->attach($traineeId, [
                'completed_at' => $completedAt,
                'expires_at' => $expiresAt,
                'trained_by' => auth()->id(),
            ]);
            $recorded[] = $traineeId;
        }

        return back()->with('message', count($recorded) . ' refresher(s) recorded successfully');
    }

    public function updateCompletion(Request $request, Refresher $refresher, Trainee $trainee)
    {
        $validated = $request->validate([
            'completed_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $completedAt = Carbon::parse($validated['completed_at']);
        $expiresAt = $refresher->calculateExpiryDate($completedAt);

        $refresher->trainees()->updateExistingPivot($trainee->id, [
            'completed_at' => $completedAt,
            'expires_at' => $expiresAt,
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('message', 'Completion record updated successfully');
    }

    public function removeCompletion(Refresher $refresher, Trainee $trainee)
    {
        $refresher->trainees()->detach($trainee->id);
        return back()->with('message', 'Completion record removed');
    }

    public function show(Refresher $refresher): Response
    {
        $refresher->load(['trainees' => function ($q) {
            $q->orderByRaw('training_refresher_trainee.completed_at desc');
        }, 'creator:id,name']);

        // Get upcoming expiring refreshers (within 30 days)
        $expiringSoon = $refresher->trainees()
            ->whereRaw('training_refresher_trainee.expires_at > ?', [now()])
            ->whereRaw('training_refresher_trainee.expires_at < ?', [now()->addDays(30)])
            ->count();

        $availableTrainees = Trainee::whereIn('status', ['in_training', 'pending', 'completed', 'hired'])
            ->whereNotIn('id', $refresher->trainees()->whereRaw('training_refresher_trainee.expires_at > ?', [now()])->pluck('trainee_id'))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Training/Refreshers/Show', [
            'refresher' => $refresher,
            'availableTrainees' => $availableTrainees,
            'expiringSoon' => $expiringSoon,
        ]);
    }

    public function expiringReport(): Response
    {
        $expiring = Refresher::with(['trainees' => function ($q) {
            $q->whereRaw('training_refresher_trainee.expires_at > ?', [now()])
                ->whereRaw('training_refresher_trainee.expires_at < ?', [now()->addDays(30)])
                ->orderByRaw('training_refresher_trainee.expires_at');
        }])
            ->whereHas('trainees', function ($q) {
                $q->whereRaw('training_refresher_trainee.expires_at > ?', [now()])
                    ->whereRaw('training_refresher_trainee.expires_at < ?', [now()->addDays(30)]);
            })
            ->get();

        $expired = Refresher::with(['trainees' => function ($q) {
            $q->whereRaw('training_refresher_trainee.expires_at <= ?', [now()])
                ->orderByRaw('training_refresher_trainee.expires_at desc');
        }])
            ->whereHas('trainees', function ($q) {
                $q->whereRaw('training_refresher_trainee.expires_at <= ?', [now()]);
            })
            ->get();

        return Inertia::render('Training/Refreshers/Expiring', [
            'expiring' => $expiring,
            'expired' => $expired,
        ]);
    }
}
