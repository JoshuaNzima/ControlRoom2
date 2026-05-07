<?php

namespace App\Http\Controllers\Messages;

use App\Http\Controllers\Controller;
use App\Models\Communication\Message;
use App\Models\Communication\MessageReaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageReactionController extends Controller
{
    public function store(Request $request, Message $message)
    {
        // Check if user is a participant in the conversation
        $conversation = $message->conversation;
        if (!$conversation->participants()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        $validated = $request->validate([
            'reaction' => 'required|string|max:50',
        ]);

        // Remove existing reaction of the same type from this user
        $message->reactions()
            ->where('user_id', Auth::id())
            ->where('reaction', $validated['reaction'])
            ->delete();

        // Add new reaction
        $reaction = $message->reactions()->create([
            'user_id' => Auth::id(),
            'reaction' => $validated['reaction'],
        ]);

        // Broadcast reaction
        broadcast(new \App\Events\MessageReacted($reaction))->toOthers();

        return response()->json([
            'success' => true,
            'id' => $reaction->id,
            'reaction' => $reaction->reaction,
            'user' => ['id' => Auth::id(), 'name' => Auth::user()->name],
        ]);
    }

    public function destroy(Request $request, Message $message)
    {
        $validated = $request->validate([
            'reaction' => 'required|string|max:50',
        ]);

        $deleted = $message->reactions()
            ->where('user_id', Auth::id())
            ->where('reaction', $validated['reaction'])
            ->delete();

        // Broadcast removal
        broadcast(new \App\Events\MessageReactionRemoved([
            'message_id' => $message->id,
            'user_id' => Auth::id(),
            'reaction' => $validated['reaction'],
        ]))->toOthers();

        return response()->json(['success' => true, 'deleted' => $deleted > 0]);
    }
}
