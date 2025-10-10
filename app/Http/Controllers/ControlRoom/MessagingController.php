<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Communication\{Conversation, Message, AgentStatus};
use App\Events\MessageSent;
use App\Events\AgentStatusUpdated;
use App\Events\EmergencyAlert;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MessagingController extends Controller
{
    public function index()
    {
        $conversations = Conversation::with(['participants', 'messages' => function ($query) {
            $query->latest()->take(1);
        }])
        ->whereHas('participants', function ($query) {
            $query->where('user_id', Auth::id());
        })
        ->latest('last_message_at')
        ->get();

        // Return all users instead of filtering by a role
        $agents = User::query()
            ->with('agentStatus')
            ->get()
            ->map(function ($agent) {
                return [
                    'id' => $agent->id,
                    'name' => $agent->name,
                    'status' => $agent->agentStatus?->status ?? 'offline',
                    'location' => $agent->agentStatus?->location,
                    'last_seen' => $agent->agentStatus?->updated_at,
                ];
            });

        return Inertia::render('ControlRoom/Messaging/Index', [
            'conversations' => $conversations,
            'agents' => $agents,
        ]);
    }

    public function show(Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        $conversation->load([
            'participants.agentStatus',
            'messages' => function ($query) {
                $query->with('sender')->latest()->take(50);
            }
        ]);

        $conversation->markAsRead(Auth::user());

        return Inertia::render('ControlRoom/Messaging/Show', [
            'conversation' => $conversation,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required_if:type,group,broadcast|string|max:255',
            'type' => 'required|in:' . implode(',', Conversation::TYPES),
            'participants' => 'required|array|min:1',
            'participants.*' => 'exists:users,id',
        ]);

        $conversation = DB::transaction(function () use ($validated) {
            $conversation = Conversation::create([
                'title' => $validated['title'] ?? null,
                'type' => $validated['type'],
                'created_by' => Auth::id(),
                'last_message_at' => now(),
            ]);

            // Add creator as admin
            $conversation->addParticipants([Auth::id()], 'admin');
            
            // Add other participants
            $conversation->addParticipants($validated['participants']);

            return $conversation;
        });

        return redirect()->route('control-room.messaging.show', $conversation);
    }

    public function storeMessage(Request $request, Conversation $conversation)
    {
        $this->authorize('sendMessage', $conversation);

        $validated = $request->validate([
            'content' => 'required|string',
            'is_emergency' => 'sometimes|boolean',
            'type' => 'sometimes|in:' . implode(',', Message::TYPES),
            'metadata' => 'nullable|array',
        ]);

        $type = $validated['type']
            ?? (($validated['is_emergency'] ?? false) ? 'emergency' : 'text');

        $message = $conversation->messages()->create([
            'sender_id' => Auth::id(),
            'type' => $type,
            'content' => $validated['content'],
            'metadata' => $validated['metadata'] ?? null,
        ]);

        $conversation->update(['last_message_at' => now()]);

        // Eager load sender for response and broadcasting
        $message->load('sender');

        // Broadcast the message to other participants
        broadcast(new MessageSent($message))->toOthers();

        return response()->json([
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender_id' => $message->sender_id,
            'sender' => [
                'id' => $message->sender->id,
                'name' => $message->sender->name,
            ],
            'content' => $message->content,
            'is_emergency' => $message->type === 'emergency',
            'created_at' => $message->created_at,
        ]);
    }

    public function updateAgentStatus(Request $request)
    {
        $validated = $request->validate([
            'status' => 'required|in:' . implode(',', AgentStatus::STATUSES),
            'location' => 'nullable|array',
            'location.lat' => 'required_with:location|numeric',
            'location.lng' => 'required_with:location|numeric',
            'battery_level' => 'nullable|integer|min:0|max:100',
        ]);

        $status = Auth::user()->agentStatus()->updateOrCreate(
            ['user_id' => Auth::id()],
            [
                'status' => $validated['status'],
                'location' => $validated['location'] ?? null,
                'location_updated_at' => $validated['location'] ? now() : null,
                'battery_level' => $validated['battery_level'] ?? null,
            ]
        );

        // Broadcast status update
        broadcast(new AgentStatusUpdated(Auth::user()))->toOthers();

        return response()->json($status);
    }

    public function broadcastEmergency(Request $request)
    {
        $validated = $request->validate([
            'location' => 'required|array',
            'location.lat' => 'required|numeric',
            'location.lng' => 'required|numeric',
            'details' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            // Update agent status to emergency
            $status = Auth::user()->agentStatus()->updateOrCreate(
                ['user_id' => Auth::id()],
                [
                    'status' => 'emergency',
                    'location' => $validated['location'],
                    'location_updated_at' => now(),
                ]
            );

            // Create emergency broadcast conversation if it doesn't exist
            $conversation = Conversation::firstOrCreate(
                ['type' => 'broadcast', 'title' => 'Emergency Alerts'],
                ['created_by' => Auth::id()]
            );

            // Add all control room operators and supervisors if they're not already participants
            $operators = User::role(['control_room_operator', 'supervisor'])->get();
            $conversation->addParticipants($operators->pluck('id')->toArray());

            // Create emergency message
            $message = $conversation->messages()->create([
                'sender_id' => Auth::id(),
                'type' => 'emergency',
                'content' => 'Emergency Alert: ' . Auth::user()->name,
                'metadata' => [
                    'location' => $validated['location'],
                    'details' => $validated['details'],
                ],
            ]);

            broadcast(new EmergencyAlert($message))->toOthers();
        });

        return response()->json(['message' => 'Emergency alert broadcast successfully']);
    }
}