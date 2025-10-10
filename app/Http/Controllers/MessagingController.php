<?php

namespace App\Http\Controllers;

use App\Events\EmergencyAlert;
use App\Events\AgentStatusUpdated;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MessagingController extends Controller
{
    public function index()
    {
        $conversations = Conversation::with(['participants', 'lastMessage.sender'])
            ->whereHas('participants', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->withCount(['unreadMessages' => function ($query) {
                $query->where('user_id', '!=', Auth::id());
            }])
            ->latest()
            ->get();

        // Return all users; use currentStatus for status and location
        $agents = User::query()
            ->with(['currentStatus'])
            ->get()
            ->map(function ($agent) {
                $location = $agent->currentStatus?->location ?? null;
                return [
                    'id' => $agent->id,
                    'name' => $agent->name,
                    'status' => $agent->currentStatus?->status ?? 'offline',
                    'latitude' => is_array($location) ? ($location['lat'] ?? null) : null,
                    'longitude' => is_array($location) ? ($location['lng'] ?? null) : null,
                    'last_seen' => $agent->currentStatus?->location_updated_at ?? $agent->currentStatus?->updated_at,
                    // Assignment field removed as Assignment model is not defined
                    'current_assignment' => null,
                ];
            });

        return Inertia::render('ControlRoom/Messaging/Index', [
            'conversations' => $conversations,
            'agents' => $agents,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:direct,group',
            'name' => 'required_if:type,group',
            'participants' => 'required|array|min:1',
            'participants.*' => 'exists:users,id',
            'isEmergency' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            $conversation = Conversation::create([
                'type' => $validated['type'],
                'name' => $validated['name'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Add participants
            $participants = collect($validated['participants'])
                ->push(Auth::id()) // Include the current user
                ->unique()
                ->values();

            $conversation->participants()->attach($participants);

            // Create initial message if it's an emergency
            if ($validated['isEmergency'] ?? false) {
                $message = $conversation->messages()->create([
                    'content' => '🚨 Emergency Alert',
                    'sender_id' => Auth::id(),
                    'is_emergency' => true,
                ]);

                // Broadcast emergency alert
                broadcast(new EmergencyAlert($message))->toOthers();
            }

            DB::commit();

            return redirect()->route('control-room.messaging.show', $conversation);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Conversation $conversation)
    {
        // Authorize that the user is a participant
        $this->authorize('view', $conversation);

        $conversation->load(['participants', 'messages.sender']);

        // Mark messages as read
        $conversation->messages()
            ->where('sender_id', '!=', Auth::id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return Inertia::render('ControlRoom/Messaging/Show', [
            'conversation' => $conversation,
        ]);
    }

    public function sendMessage(Request $request, Conversation $conversation)
    {
        $this->authorize('sendMessage', $conversation);

        $validated = $request->validate([
            'content' => 'required|string',
            'is_emergency' => 'boolean',
        ]);

        $message = $conversation->messages()->create([
            'content' => $validated['content'],
            'sender_id' => Auth::id(),
            'is_emergency' => $validated['is_emergency'] ?? false,
        ]);

        if ($message->is_emergency) {
            broadcast(new EmergencyAlert($message))->toOthers();
        }

        return response()->json($message->load('sender'));
    }

    public function updateStatus(Request $request)
    {
        $validated = $request->validate([
            'status' => 'required|in:available,on_duty,offline,emergency',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $user = Auth::user();
        
        // Update status and location on AgentStatus
        $user->currentStatus()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'status' => $validated['status'],
                'location' => [
                    'lat' => $validated['latitude'],
                    'lng' => $validated['longitude'],
                ],
                'location_updated_at' => now(),
            ]
        );

        // Broadcast status update
        broadcast(new AgentStatusUpdated($user))->toOthers();

        return response()->json(['message' => 'Status updated successfully']);
    }
}