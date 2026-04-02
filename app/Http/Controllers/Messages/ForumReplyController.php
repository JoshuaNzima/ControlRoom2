<?php

namespace App\Http\Controllers\Messages;

use App\Http\Controllers\Controller;
use App\Models\Communication\Forum;
use App\Models\Communication\ForumThread;
use App\Models\Communication\ForumReply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ForumReplyController extends Controller
{
    public function store(Request $request, Forum $forum, ForumThread $thread)
    {
        $user = Auth::user();

        if (!$forum->isMember($user)) {
            abort(403, 'You must be a member to reply.');
        }

        if ($thread->is_locked) {
            abort(403, 'This thread is locked.');
        }

        if ($forum->is_archived) {
            abort(403, 'This forum is archived.');
        }

        $validated = $request->validate([
            'content' => 'required|string|max:5000',
            'parent_id' => 'nullable|exists:forum_replies,id',
        ]);

        // Validate parent_id belongs to this thread
        if (!empty($validated['parent_id'])) {
            $parentExists = ForumReply::where('id', $validated['parent_id'])
                ->where('thread_id', $thread->id)
                ->exists();
            if (!$parentExists) {
                return back()->withErrors(['parent_id' => 'Invalid parent reply.']);
            }
        }

        $reply = $thread->replies()->create([
            'user_id' => $user->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'content' => $validated['content'],
        ]);

        // Mark forum as read for the user
        $forum->markAsRead($user);

        return back()->with('success', 'Reply posted successfully.');
    }

    public function update(Request $request, Forum $forum, ForumThread $thread, ForumReply $reply)
    {
        $user = Auth::user();

        if ($reply->user_id !== $user->id && !$forum->isAdmin($user)) {
            abort(403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $reply->update($validated);

        return back()->with('success', 'Reply updated successfully.');
    }

    public function destroy(Forum $forum, ForumThread $thread, ForumReply $reply)
    {
        $user = Auth::user();

        if ($reply->user_id !== $user->id && !$forum->isAdmin($user)) {
            abort(403);
        }

        // Check if this is the first reply (thread content)
        $isFirstReply = $thread->replies()->oldest()->first()->id === $reply->id;
        if ($isFirstReply && !$forum->isAdmin($user)) {
            return back()->withErrors(['error' => 'Cannot delete the thread content.']);
        }

        $reply->delete();

        return back()->with('success', 'Reply deleted successfully.');
    }

    public function vote(Request $request, Forum $forum, ForumThread $thread, ForumReply $reply)
    {
        $user = Auth::user();

        if (!$forum->isMember($user)) {
            abort(403);
        }

        $validated = $request->validate([
            'type' => 'required|in:upvote,downvote',
        ]);

        $result = $reply->vote($user, $validated['type']);

        return response()->json([
            'upvotes_count' => $reply->upvotes_count,
            'user_vote' => $result,
        ]);
    }

    public function markSolution(Request $request, Forum $forum, ForumThread $thread, ForumReply $reply)
    {
        $user = Auth::user();

        // Only thread creator or moderators can mark solutions
        if ($thread->user_id !== $user->id && !$forum->isModerator($user)) {
            abort(403, 'Only the thread creator or moderators can mark solutions.');
        }

        // Reset all other solutions
        $thread->replies()->update(['is_solution' => false]);

        // Mark this reply as solution
        $reply->update(['is_solution' => true]);

        // Mark thread as solved
        $thread->update(['is_solved' => true]);

        return response()->json([
            'message' => 'Reply marked as solution.',
            'reply_id' => $reply->id,
        ]);
    }
}
