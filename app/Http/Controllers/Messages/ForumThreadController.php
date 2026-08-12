<?php

namespace App\Http\Controllers\Messages;

use App\Http\Controllers\Controller;
use App\Models\Communication\Forum;
use App\Models\Communication\ForumThread;
use App\Models\Communication\ForumReply;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ForumThreadController extends Controller
{
    public function store(Request $request, Forum $forum)
    {
        $user = Auth::user();

        if (!$forum->isMember($user)) {
            abort(403, 'You must be a member to create threads.');
        }

        if ($forum->is_archived) {
            return back()->withErrors(['error' => 'This forum is archived.']);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'content' => 'required|string|max:10000',
            'type' => 'required|in:discussion,announcement,question,poll',
        ]);

        // Only admins/moderators can post announcements
        if ($validated['type'] === 'announcement' && !$forum->isAdmin($user)) {
            abort(403, 'Only forum admins can post announcements.');
        }

        $thread = $forum->threads()->create([
            ...$validated,
            'user_id' => $user->id,
        ]);

        // Add first reply as the thread content
        $thread->replies()->create([
            'user_id' => $user->id,
            'content' => $validated['content'],
        ]);

        $thread->updateReplyStats();

        return redirect()->route('messages.forums.threads.show', [$forum, $thread]);
    }

    public function show(Forum $forum, ForumThread $thread)
    {
        $user = Auth::user();

        if ($forum->type === 'private' && !$forum->isMember($user)) {
            abort(403);
        }

        $thread->incrementViews();

        $replies = $thread->topLevelReplies()
            ->with(['user:id,name', 'children.user:id,name'])
            ->orderBy('upvotes_count', 'desc')
            ->orderBy('created_at', 'asc')
            ->paginate(20);

        // Mark forum as read
        $forum->markAsRead($user);

        $isAdmin = $forum->isMember($user) && $forum->isAdmin($user);

        return Inertia::render('Messages/Forums/Thread', [
            'forum' => $forum,
            'thread' => $thread->load('user:id,name'),
            'replies' => $replies,
            'isAdmin' => $isAdmin,
            'canReply' => $forum->isMember($user) && !$thread->is_locked,
        ]);
    }

    public function update(Request $request, Forum $forum, ForumThread $thread)
    {
        $user = Auth::user();

        if ($thread->user_id !== $user->id && !$forum->isAdmin($user)) {
            abort(403);
        }

        if ($thread->is_locked && !$forum->isAdmin($user)) {
            abort(403, 'This thread is locked.');
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:200',
            'content' => 'sometimes|string|max:10000',
        ]);

        if (isset($validated['title'])) {
            $thread->update(['title' => $validated['title']]);
        }

        if (isset($validated['content'])) {
            // Update the first reply (the thread content)
            $firstReply = $thread->replies()->oldest()->first();
            if ($firstReply) {
                $firstReply->update(['content' => $validated['content']]);
            }
        }

        return back()->with('success', 'Thread updated successfully.');
    }

    public function destroy(Forum $forum, ForumThread $thread)
    {
        $user = Auth::user();

        if ($thread->user_id !== $user->id && !$forum->isAdmin($user)) {
            abort(403);
        }

        $thread->delete();

        return redirect()->route('messages.forums.show', $forum)
            ->with('success', 'Thread deleted successfully.');
    }

    public function pin(Forum $forum, ForumThread $thread)
    {
        $user = Auth::user();

        if (!$forum->isAdmin($user)) {
            abort(403);
        }

        $thread->update(['is_pinned' => true]);

        return back()->with('success', 'Thread pinned.');
    }

    public function unpin(Forum $forum, ForumThread $thread)
    {
        $user = Auth::user();

        if (!$forum->isAdmin($user)) {
            abort(403);
        }

        $thread->update(['is_pinned' => false]);

        return back()->with('success', 'Thread unpinned.');
    }

    public function lock(Forum $forum, ForumThread $thread)
    {
        $user = Auth::user();

        if (!$forum->isAdmin($user)) {
            abort(403);
        }

        $thread->update(['is_locked' => true]);

        return back()->with('success', 'Thread locked.');
    }

    public function unlock(Forum $forum, ForumThread $thread)
    {
        $user = Auth::user();

        if (!$forum->isAdmin($user)) {
            abort(403);
        }

        $thread->update(['is_locked' => false]);

        return back()->with('success', 'Thread unlocked.');
    }
}
