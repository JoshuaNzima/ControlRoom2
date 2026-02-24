<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\Training\Regimen;
use App\Models\Training\RegimenGoal;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegimenController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $track = (string) $request->query('track', '');

        $regimens = Regimen::query()
            ->withCount('goals')
            ->when($q !== '', fn ($qq) => $qq->where('title', 'like', "%{$q}%"))
            ->when(in_array($track, ['standard', 'rapid_response'], true), fn ($qq) => $qq->where('track', $track))
            ->orderBy('title')
            ->get()
            ->map(function (Regimen $r) {
                return [
                    'id' => $r->id,
                    'title' => $r->title,
                    'track' => $r->track,
                    'default_days' => $r->default_days,
                    'description' => $r->description,
                    'goals_count' => (int) $r->goals_count,
                    'goals' => $r->goals()->orderBy('sort_order')->get(['id', 'title', 'description', 'max_score', 'weight', 'sort_order']),
                ];
            });

        return Inertia::render('Training/Regimens/Index', [
            'regimens' => $regimens,
            'filters' => $request->only(['q', 'track']),
            'minTrainingDays' => 5,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'track' => ['required', 'in:standard,rapid_response'],
            'default_days' => ['nullable', 'integer', 'min:10', 'max:365'],
            'description' => ['nullable', 'string'],
        ]);

        Regimen::create([
            'title' => $data['title'],
            'track' => $data['track'],
            'default_days' => max(10, (int) ($data['default_days'] ?? 10)),
            'description' => $data['description'] ?? null,
            'created_by' => optional($request->user())->id,
        ]);

        return back()->with('message', 'Regimen created successfully');
    }

    public function update(Request $request, Regimen $regimen)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'track' => ['required', 'in:standard,rapid_response'],
            'default_days' => ['nullable', 'integer', 'min:10', 'max:365'],
            'description' => ['nullable', 'string'],
        ]);

        $regimen->update([
            'title' => $data['title'],
            'track' => $data['track'],
            'default_days' => max(10, (int) ($data['default_days'] ?? 10)),
            'description' => $data['description'] ?? null,
        ]);

        return back()->with('message', 'Regimen updated successfully');
    }

    public function destroy(Request $request, Regimen $regimen)
    {
        $regimen->delete();
        return back()->with('message', 'Regimen removed successfully');
    }

    public function storeGoal(Request $request, Regimen $regimen)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'max_score' => ['nullable', 'integer', 'min:1', 'max:100'],
            'weight' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $nextOrder = (int) (RegimenGoal::where('regimen_id', $regimen->id)->max('sort_order') ?? 0) + 1;

        RegimenGoal::create([
            'regimen_id' => $regimen->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'max_score' => $data['max_score'] ?? 10,
            'weight' => $data['weight'] ?? 1,
            'sort_order' => $nextOrder,
        ]);

        return back()->with('message', 'Goal added successfully');
    }

    public function updateGoal(Request $request, RegimenGoal $goal)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'max_score' => ['nullable', 'integer', 'min:1', 'max:100'],
            'weight' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:1', 'max:999'],
        ]);

        $goal->update([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'max_score' => $data['max_score'] ?? $goal->max_score,
            'weight' => $data['weight'] ?? $goal->weight,
            'sort_order' => $data['sort_order'] ?? $goal->sort_order,
        ]);

        return back()->with('message', 'Goal updated successfully');
    }

    public function destroyGoal(Request $request, RegimenGoal $goal)
    {
        $goal->delete();
        return back()->with('message', 'Goal removed successfully');
    }
}
