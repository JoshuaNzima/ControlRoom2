<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\ChecklistTemplate;
use App\Models\HR\GuardChecklist;
use App\Models\HR\GuardChecklistItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChecklistAssignmentController extends Controller
{
    public function store(Request $request)
    {
        $this->authorize('permission:hr.employees.manage');

        $validated = $request->validate([
            'guard_id' => ['required','integer','exists:guards,id'],
            'checklist_template_id' => ['required','integer','exists:checklist_templates,id'],
            'start_date' => ['nullable','date'],
        ]);

        $template = ChecklistTemplate::with(['items' => function($q){ $q->orderBy('sort_order'); }])->findOrFail($validated['checklist_template_id']);
        $start = !empty($validated['start_date']) ? Carbon::parse($validated['start_date']) : Carbon::today();

        $checklist = GuardChecklist::create([
            'guard_id' => $validated['guard_id'],
            'checklist_template_id' => $template->id,
            'type' => $template->type,
            'status' => 'active',
            'start_date' => $start->toDateString(),
            'due_date' => $template->items->max('default_due_days') ? $start->copy()->addDays((int)$template->items->max('default_due_days'))->toDateString() : null,
            'assigned_by' => Auth::id(),
        ]);

        foreach ($template->items as $ti) {
            GuardChecklistItem::create([
                'guard_checklist_id' => $checklist->id,
                'checklist_template_item_id' => $ti->id,
                'title' => $ti->title,
                'description' => $ti->description,
                'due_date' => $ti->default_due_days ? $start->copy()->addDays((int)$ti->default_due_days)->toDateString() : null,
                'status' => 'pending',
            ]);
        }

        return back()->with('success', 'Checklist assigned');
    }
}
