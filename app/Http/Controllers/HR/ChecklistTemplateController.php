<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\ChecklistTemplate;
use App\Models\HR\ChecklistTemplateItem;
use Illuminate\Http\Request;

class ChecklistTemplateController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'type' => ['required','in:onboarding,offboarding'],
            'active' => ['sometimes','boolean'],
        ]);

        $data['active'] = (bool)($data['active'] ?? true);
        ChecklistTemplate::create($data);

        return back()->with('success', 'Template created');
    }

    public function update(Request $request, ChecklistTemplate $template)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'type' => ['required','in:onboarding,offboarding'],
            'active' => ['sometimes','boolean'],
        ]);

        $template->update([
            'name' => $data['name'],
            'type' => $data['type'],
            'active' => (bool)($data['active'] ?? $template->active),
        ]);

        return back()->with('success', 'Template updated');
    }

    public function destroy(ChecklistTemplate $template)
    {
        // delete items first to avoid orphans
        $template->items()->delete();
        $template->delete();

        return back()->with('success', 'Template deleted');
    }

    public function storeItem(Request $request, ChecklistTemplate $template)
    {
        $data = $request->validate([
            'title' => ['required','string','max:255'],
            'description' => ['nullable','string','max:1000'],
            'default_due_days' => ['nullable','integer','min:0'],
        ]);

        $sort = (int) ($template->items()->max('sort_order') ?? 0) + 1;

        $template->items()->create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'default_due_days' => $data['default_due_days'] ?? null,
            'sort_order' => $sort,
        ]);

        return back()->with('success', 'Item added');
    }

    public function updateItem(Request $request, ChecklistTemplateItem $item)
    {
        $data = $request->validate([
            'title' => ['required','string','max:255'],
            'description' => ['nullable','string','max:1000'],
            'default_due_days' => ['nullable','integer','min:0'],
        ]);

        $item->update([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'default_due_days' => $data['default_due_days'] ?? null,
        ]);

        return back()->with('success', 'Item updated');
    }

    public function destroyItem(ChecklistTemplateItem $item)
    {
        $item->delete();
        return back()->with('success', 'Item deleted');
    }
}
