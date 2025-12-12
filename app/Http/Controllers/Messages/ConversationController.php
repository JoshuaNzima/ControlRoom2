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
            ->get();

        $agents = User::orderBy('name')->get(['id','name']);

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

        $conversation = DB::transaction(function () use ($validated) {
            $conv = Conversation::create([
                'title' => $validated['title'] ?? null,
                'type' => $validated['type'],
                'created_by' => Auth::id(),
                'last_message_at' => now(),
            ]);
            // Add creator as admin
            $conv->addParticipants([Auth::id()], 'admin');
            // Add other participants
            $conv->addParticipants(collect($validated['participants'])->filter()->unique()->toArray());
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
            'content' => $message->content,
            'is_emergency' => $message->type === 'emergency',
            'created_at' => $message->created_at,
        ]);
    }

    public function markRead(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->participants()->where('user_id', Auth::id())->exists(), 403);
        $conversation->markAsRead(Auth::user());
        return response()->json(['status' => 'ok']);
    }
}
