<?php

namespace App\Http\Controllers\Operations\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\IncidentComment;
use Illuminate\Http\Request;
use App\Events\NotificationEvent;

class IncidentCommentController extends Controller
{
    public function store(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'comment' => 'required|string',
            'is_internal' => 'boolean',
        ]);

        $comment = $incident->comments()->create([
            ...$validated,
            'user_id' => auth()->id(),
        ]);

        // Load the user relationship for the response
        $comment->load('user');

        // Notify relevant parties
        event(new NotificationEvent('incident_comment', [
            'incident_id' => $incident->id,
            'comment' => $comment
        ]));

        return back()->with('success', 'Comment added successfully.');
    }

    public function destroy(IncidentComment $comment)
    {
        $this->authorize('delete', $comment);
        $comment->delete();

        return back()->with('success', 'Comment deleted successfully.');
    }
}