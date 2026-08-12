<?php

namespace App\Http\Controllers\Messages;

use App\Http\Controllers\Controller;
use App\Models\Communication\Forum;
use App\Models\Communication\ForumThread;
use App\Models\Communication\ForumReply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ForumController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get user's forums with unread counts
        $myForums = Forum::whereHas('members', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
        ->withCount(['threads', 'members'])
        ->get()
        ->map(function ($forum) use ($user) {
            $forum->unread_count = $forum->unreadCountFor($user);
            return $forum;
        });

        // Get public forums
        $publicForums = Forum::public()
            ->whereDoesntHave('members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->withCount(['threads', 'members'])
            ->get();

        return Inertia::render('Messages/Forums/Index', [
            'myForums' => $myForums,
            'publicForums' => $publicForums,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:forums',
            'description' => 'nullable|string|max:500',
            'type' => 'required|in:public,private,announcement',
            'category' => 'required|in:general,department,project,emergency,social',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:50',
        ]);

        $forum = Forum::create([
            ...$validated,
            'slug' => Str::slug($validated['name']),
            'created_by' => Auth::id(),
        ]);

        // Add creator as admin
        $forum->members()->attach(Auth::id(), [
            'role' => 'admin',
            'joined_at' => now(),
        ]);

        return redirect()->route('messages.forums.show', $forum);
    }

    public function show(Forum $forum)
    {
        $user = Auth::user();

        // Check access for private forums
        if ($forum->type === 'private' && !$forum->isMember($user)) {
            abort(403, 'This is a private forum.');
        }

        $forum->markAsRead($user);

        // Get threads with pagination
        $threads = $forum->threads()
            ->with(['user:id,name', 'lastReplyBy:id,name'])
            ->orderByDesc('is_pinned')
            ->orderByDesc('last_reply_at')
            ->orderByDesc('created_at')
            ->paginate(20);

        $isMember = $forum->isMember($user);
        $isAdmin = $isMember && $forum->isAdmin($user);

        return Inertia::render('Messages/Forums/Show', [
            'forum' => $forum,
            'threads' => $threads,
            'isMember' => $isMember,
            'isAdmin' => $isAdmin,
            'memberCount' => $forum->members()->count(),
        ]);
    }

    public function join(Forum $forum)
    {
        $user = Auth::user();

        if ($forum->type === 'private') {
            abort(403, 'This is a private forum.');
        }

        if (!$forum->isMember($user)) {
            $forum->members()->attach($user->id, [
                'role' => 'member',
                'joined_at' => now(),
            ]);
        }

        return back()->with('success', 'Joined forum successfully.');
    }

    public function leave(Forum $forum)
    {
        $user = Auth::user();

        // Can't leave if you're the creator and only admin
        if ($forum->created_by === $user->id) {
            $adminCount = $forum->members()->wherePivot('role', 'admin')->count();
            if ($adminCount <= 1) {
                return back()->withErrors(['error' => 'You must assign another admin before leaving.']);
            }
        }

        $forum->members()->detach($user->id);

        return redirect()->route('messages.forums.index')->with('success', 'Left forum successfully.');
    }

    public function update(Request $request, Forum $forum)
    {
        $user = Auth::user();

        if (!$forum->isAdmin($user)) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100|unique:forums,name,' . $forum->id,
            'description' => 'nullable|string|max:500',
            'type' => 'sometimes|in:public,private,announcement',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:50',
            'is_archived' => 'sometimes|boolean',
        ]);

        if (isset($validated['name']) && $validated['name'] !== $forum->name) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        if (!empty($validated['is_archived']) && !$forum->is_archived) {
            $validated['archived_at'] = now();
        }

        $forum->update($validated);

        return back()->with('success', 'Forum updated successfully.');
    }

    public function members(Forum $forum)
    {
        $user = Auth::user();

        if (!$forum->isMember($user)) {
            abort(403);
        }

        $members = $forum->members()
            ->with('roles')
            ->orderByPivot('role')
            ->orderBy('name')
            ->get();

        return Inertia::render('Messages/Forums/Members', [
            'forum' => $forum,
            'members' => $members,
            'isAdmin' => $forum->isAdmin($user),
        ]);
    }

    public function addMember(Request $request, Forum $forum)
    {
        $user = Auth::user();

        if (!$forum->isAdmin($user)) {
            abort(403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:admin,moderator,member',
        ]);

        if (!$forum->isMember(User::find($validated['user_id']))) {
            $forum->members()->attach($validated['user_id'], [
                'role' => $validated['role'],
                'joined_at' => now(),
            ]);
        }

        return back()->with('success', 'Member added successfully.');
    }

    public function removeMember(Request $request, Forum $forum, $userId)
    {
        $user = Auth::user();

        if (!$forum->isAdmin($user)) {
            abort(403);
        }

        // Can't remove the creator
        if ((int)$userId === $forum->created_by) {
            return back()->withErrors(['error' => 'Cannot remove the forum creator.']);
        }

        $forum->members()->detach($userId);

        return back()->with('success', 'Member removed successfully.');
    }
}
