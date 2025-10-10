<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $tickets = Ticket::with(['reporter', 'assignee'])
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($request->priority, function ($query, $priority) {
                return $query->where('priority', $priority);
            })
            ->when($request->category, function ($query, $category) {
                return $query->where('category', $category);
            })
            ->latest()
            ->paginate(10);

        return Inertia::render('ControlRoom/Tickets/Index', [
            'tickets' => $tickets,
            'filters' => [
                'statuses' => Ticket::STATUSES,
                'priorities' => Ticket::PRIORITIES,
                'categories' => Ticket::CATEGORIES,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'required|in:' . implode(',', Ticket::PRIORITIES),
            'category' => 'required|in:' . implode(',', Ticket::CATEGORIES),
            'assigned_to' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date|after:today',
        ]);

        $ticket = Ticket::create([
            ...$validated,
            'reported_by' => Auth::id(),
            'status' => 'open',
        ]);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('ticket-attachments');
                $ticket->attachments()->create([
                    'filename' => $file->getClientOriginalName(),
                    'path' => $path,
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                ]);
            }
        }

        return redirect()->route('control-room.tickets.show', $ticket)
            ->with('success', 'Ticket created successfully.');
    }

    public function show(Ticket $ticket)
    {
        $ticket->load(['reporter', 'assignee', 'comments.user', 'attachments']);

        return Inertia::render('ControlRoom/Tickets/Show', [
            'ticket' => $ticket,
            'comments' => $ticket->comments()->with('user')->latest()->get(),
            'canManageTicket' => Auth::user()->can('manage', $ticket),
        ]);
    }

    public function update(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'status' => 'sometimes|required|in:' . implode(',', Ticket::STATUSES),
            'priority' => 'sometimes|required|in:' . implode(',', Ticket::PRIORITIES),
            'assigned_to' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'resolution' => 'required_if:status,resolved',
        ]);

        $ticket->update($validated);

        if ($request->has('status') && $request->status === 'escalated') {
            $this->escalateTicket($ticket);
        }

        return back()->with('success', 'Ticket updated successfully.');
    }

    public function addComment(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'comment' => 'required|string',
            'is_internal' => 'boolean',
        ]);

        $comment = $ticket->comments()->create([
            ...$validated,
            'user_id' => Auth::id(),
        ]);

        return back()->with('success', 'Comment added successfully.');
    }

    protected function escalateTicket(Ticket $ticket)
    {
        // Create a child ticket for escalation
        $escalatedTicket = Ticket::create([
            'title' => "Escalated: {$ticket->title}",
            'description' => "Escalated from Ticket #{$ticket->id}\n\n{$ticket->description}",
            'status' => 'open',
            'priority' => 'high',
            'category' => $ticket->category,
            'reported_by' => Auth::id(),
            'parent_ticket_id' => $ticket->id,
            'escalation_level' => $ticket->escalation_level + 1,
        ]);

        // Notify relevant personnel
        // TODO: Implement notification system
    }
}