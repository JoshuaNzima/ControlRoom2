<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\GuardChecklistItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChecklistController extends Controller
{
    public function updateItemStatus(Request $request, GuardChecklistItem $item)
    {

        $validated = $request->validate([
            'status' => ['required', 'in:pending,done,skipped'],
        ]);

        $status = $validated['status'];
        $item->status = $status;
        if ($status === 'done') {
            $item->completed_at = Carbon::now();
            $item->completed_by = Auth::id();
        } else {
            $item->completed_at = null;
            $item->completed_by = null;
        }
        $item->save();

        // Update parent checklist status if all items are complete
        $checklist = $item->checklist()->withCount([
            'items as pending_count' => function ($q) { $q->where('status', 'pending'); },
        ])->first();

        if ($checklist) {
            if ((int)$checklist->pending_count === 0) {
                $checklist->status = 'completed';
                $checklist->completed_at = Carbon::now();
            } else {
                if ($checklist->status !== 'active') {
                    $checklist->status = 'active';
                }
                $checklist->completed_at = null;
            }
            $checklist->save();
        }

        return back()->with('success', 'Checklist item updated');
    }
}
