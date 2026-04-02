<?php

namespace App\Http\Controllers\Messages;

use App\Events\MessageSent;
use App\Events\EmergencyAlert;
use App\Http\Controllers\Controller;
use App\Models\Communication\Conversation;
use App\Models\Communication\Message as ChatMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ConversationController extends Controller
{
    public function users()
    {
        $users = User::orderBy('name')->get(['id','name']);
        return response()->json($users);
    }

    public function index()
    {
        $conversations = Conversation::with([
                'participants:id,name',
                'messages' => function ($q) {
                    $q->with('sender:id,name')->latest()->limit(1);
                },
            ])
            ->whereHas('participants', function ($q) {
                $q->where('user_id', Auth::id());
            })
            ->orderByDesc('last_message_at')
            ->get()
            ->map(function ($conversation) {
                $pivot = $conversation->participants
                    ->firstWhere('id', Auth::id())
                    ?->pivot;

                $lastReadAt = $pivot?->last_read_at;

                $unreadQuery = $conversation->messages()
                    ->where('sender_id', '!=', Auth::id());

                if ($lastReadAt) {
                    $unreadQuery->where('created_at', '>', $lastReadAt);
                }

                $conversation->unread_count = (int) $unreadQuery->count();
                $conversation->last_message = $conversation->messages->first();

                return $conversation;
            });

        $agents = User::query()
            ->leftJoin('agent_statuses', 'agent_statuses.user_id', '=', 'users.id')
            ->orderBy('users.name')
            ->get([
                'users.id',
                'users.name',
                'agent_statuses.status as status',
            ]);

        return Inertia::render('Messages/Index', [
            'conversations' => $conversations,
            'agents' => $agents,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:direct,group',
            'title' => 'required_if:type,group|nullable|string|max:255',
            'participants' => 'required|array|min:1',
            'participants.*' => 'exists:users,id',
            'is_emergency' => 'sometimes|boolean',
        ]);

        $participants = collect($validated['participants'])
            ->filter()
            ->unique()
            ->reject(fn ($id) => (string) $id === (string) Auth::id())
            ->values();

        if ($participants->isEmpty()) {
            return back()->withErrors([
                'participants' => 'Please select at least one other participant.',
            ]);
        }

        if (($validated['type'] ?? null) === 'direct' && $participants->count() !== 1) {
            return back()->withErrors([
                'participants' => 'Direct messages must have exactly one participant.',
            ]);
        }

        if (($validated['type'] ?? null) === 'direct') {
            $otherId = $participants->first();
            $existing = Conversation::query()
                ->where('type', 'direct')
                ->whereHas('participants', fn ($q) => $q->where('user_id', Auth::id()))
                ->whereHas('participants', fn ($q) => $q->where('user_id', $otherId))
                ->whereDoesntHave('participants', fn ($q) => $q->whereNotIn('user_id', [Auth::id(), $otherId]))
                ->first();

            if ($existing) {
                if (!empty($validated['is_emergency'])) {
                    $msg = $existing->messages()->create([
                        'sender_id' => Auth::id(),
                        'type' => 'emergency',
                        'content' => 'Emergency alert',
                    ]);
                    $existing->update(['last_message_at' => now()]);
                    $msg->load('sender:id,name');
                    broadcast(new MessageSent($msg))->toOthers();
                    broadcast(new EmergencyAlert($msg))->toOthers();
                }

                return redirect()->route('messages.conversations.show', $existing);
            }
        }

        $conversation = DB::transaction(function () use ($validated, $participants) {
            $conv = Conversation::create([
                'title' => $validated['title'] ?? null,
                'type' => $validated['type'],
                'created_by' => Auth::id(),
                'last_message_at' => now(),
            ]);
            // Add creator as admin
            $conv->addParticipants([Auth::id()], 'admin');
            // Add other participants
            $conv->addParticipants($participants->toArray());
            return $conv;
        });

        if (!empty($validated['is_emergency'])) {
            $msg = $conversation->messages()->create([
                'sender_id' => Auth::id(),
                'type' => 'emergency',
                'content' => 'Emergency alert',
            ]);
            $conversation->update(['last_message_at' => now()]);
            $msg->load('sender:id,name');
            broadcast(new MessageSent($msg))->toOthers();
            broadcast(new EmergencyAlert($msg))->toOthers();
        }

        return redirect()->route('messages.conversations.show', $conversation);
    }

    public function show(Conversation $conversation)
    {
        abort_unless($conversation->participants()->where('user_id', Auth::id())->exists(), 403);

        $conversation->load([
            'participants:id,name',
            'messages' => function ($q) {
                $q->with('sender:id,name')->orderBy('id');
            }
        ]);

        $conversation->markAsRead(Auth::user());

        return Inertia::render('Messages/Show', [
            'conversation' => $conversation,
        ]);
    }

    public function sendMessage(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->participants()->where('user_id', Auth::id())->exists(), 403);

        $validated = $request->validate([
            'content' => 'required|string',
            'type' => 'sometimes|in:text,location,status_update,emergency,image,file',
            'metadata' => 'nullable|array',
            'is_emergency' => 'sometimes|boolean',
        ]);

        $type = $validated['type'] ?? (!empty($validated['is_emergency']) ? 'emergency' : 'text');

        $message = $conversation->messages()->create([
            'sender_id' => Auth::id(),
            'type' => $type,
            'content' => $validated['content'],
            'metadata' => $validated['metadata'] ?? null,
        ]);

        $conversation->update(['last_message_at' => now()]);

        $message->load('sender:id,name');
        broadcast(new MessageSent($message))->toOthers();
        if ($type === 'emergency') {
            broadcast(new EmergencyAlert($message))->toOthers();
        }

        return response()->json([
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender_id' => $message->sender_id,
            'sender' => $message->sender,
            'type' => $message->type,
            'content' => $message->content,
            'is_emergency' => $message->type === 'emergency',
            'created_at' => $message->created_at,
        ]);
    }

    public function typing(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->participants()->where('user_id', Auth::id())->exists(), 403);

        broadcast(new \App\Events\UserTyping(
            conversationId: $conversation->id,
            userId: Auth::id(),
            userName: Auth::user()->name
        ))->toOthers();

        return response()->json(['status' => 'ok']);
    }

    public function markRead(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->participants()->where('user_id', Auth::id())->exists(), 403);
        $conversation->markAsRead(Auth::user());
        return response()->json(['status' => 'ok']);
    }
}
