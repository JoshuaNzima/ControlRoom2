<?php

namespace App\Http\Controllers\Operations\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Flag;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class FlagController extends Controller
{
    public function index(Request $request)
    {
        $query = Flag::with(['flaggable', 'reporter', 'reviewer'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $flags = $query->paginate(20)->withQueryString();

        return Inertia::render('ControlRoom/Flags/Index', [
            'flags' => $flags,
            'statuses' => Flag::STATUSES,
        ]);
    }

    public function create()
    {
        // The UI currently provides a modal create form; keep route in case it's needed
        return Inertia::render('ControlRoom/Flags/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'flaggable_type' => 'required|string|in:App\\Models\\Guards\\Guard,App\\Models\\User',
            'flaggable_id' => [
                'required',
                'integer',
                function ($attribute, $value, $fail) use ($request) {
                    $model = $request->input('flaggable_type');
                    if (!class_exists($model) || !$model::find($value)) {
                        $fail('The specified flaggable item does not exist.');
                    }
                },
            ],
            'reason' => 'required|string|max:255',
            'details' => 'required|string',
            'client_id' => 'nullable|exists:clients,id',
            'title' => 'nullable|string|max:255',
            'severity' => 'nullable|string|in:low,medium,high',
        ]);

        try {
            \DB::beginTransaction();
            
            // Verify the flaggable item exists
            $flaggableModel = $validated['flaggable_type']::findOrFail($validated['flaggable_id']);
            
            $flag = Flag::create([
                'flaggable_type' => $validated['flaggable_type'],
                'flaggable_id' => $validated['flaggable_id'],
                'reason' => $validated['reason'],
                'details' => $validated['details'],
                'title' => $validated['title'] ?? null,
                'severity' => $validated['severity'] ?? 'medium',
                'reported_by' => auth()->id(),
                'status' => 'pending_review',
                'meta' => [
                    'client_id' => $validated['client_id'] ?? null,
                    'created_at_timestamp' => now()->timestamp,
                    'reporter_name' => auth()->user()->name,
                    'flaggable_name' => $flaggableModel->name ?? ($flaggableModel->employee_id ?? 'Unknown'),
                ],
            ]);

            \DB::commit();

            \Log::info('Flag created', ['flag_id' => $flag->id, 'reported_by' => auth()->id()]);
            
            return redirect()->route('control-room.flags.show', $flag)
                ->with('success', 'Flag created successfully.');
                
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            \DB::rollBack();
            \Log::error('Flag creation failed - Model not found', [
                'error' => $e->getMessage(),
                'flaggable_type' => $validated['flaggable_type'] ?? null,
                'flaggable_id' => $validated['flaggable_id'] ?? null
            ]);
            return redirect()->back()
                ->withInput()
                ->with('error', 'The specified item to flag could not be found.');
                
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Flag creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()
                ->withInput()
                ->with('error', 'An error occurred while creating the flag. Please try again.');
        }

        return redirect()->route('control-room.flags.show', $flag)
            ->with('success', 'Flag created successfully.');
    }

    public function show(Flag $flag)
    {
        $flag->load(['flaggable', 'reporter', 'reviewer']);

        return Inertia::render('ControlRoom/Flags/Show', [
            'flag' => $flag,
            'canReview' => auth()->user() ? auth()->user()->can('review flags') : false,
        ]);
    }

    public function edit(Flag $flag)
    {
        return Inertia::render('ControlRoom/Flags/Edit', [
            'flag' => $flag,
        ]);
    }

    public function update(Request $request, Flag $flag)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(Flag::STATUSES)],
            'review_notes' => 'nullable|string',
            'details' => 'nullable|string',
        ]);

        $data = [
            'status' => $validated['status'],
        ];

        if (isset($validated['review_notes'])) {
            $data['review_notes'] = $validated['review_notes'];
        }

        if (isset($validated['details'])) {
            $data['details'] = $validated['details'];
        }

        // If being reviewed/resolved, record reviewer and date
        if (in_array($validated['status'], ['under_review', 'resolved', 'dismissed'])) {
            $data['reviewed_by'] = auth()->id();
            $data['review_date'] = now();
        }

        $flag->update($data);

        return redirect()->route('control-room.flags.show', $flag)
            ->with('success', 'Flag updated successfully.');
    }

    public function destroy(Flag $flag)
    {
        $flag->delete();

        return redirect()->route('control-room.flags.index')
            ->with('success', 'Flag deleted successfully.');
    }

    public function acknowledge(Request $request, Flag $flag)
    {
        $flag->update([
            'status' => 'under_review',
            'reviewed_by' => auth()->id(),
            'review_date' => now(),
        ]);

        return back()->with('success', 'Flag acknowledged successfully.');
    }

    public function resolve(Request $request, Flag $flag)
    {
        $flag->update([
            'status' => 'resolved',
            'reviewed_by' => auth()->id(),
            'review_date' => now(),
        ]);

        return back()->with('success', 'Flag resolved successfully.');
    }

    public function escalate(Request $request, Flag $flag)
    {
        $meta = $flag->meta ?? [];
        $meta['escalation_level'] = ($meta['escalation_level'] ?? 0) + 1;

        $flag->update([
            'meta' => $meta,
            'status' => 'under_review',
        ]);

        return back()->with('success', 'Flag escalated successfully.');
    }
}