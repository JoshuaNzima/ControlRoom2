<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function index()
    {
        $query = Ticket::with(['reporter', 'assignedTo', 'client', 'clientSite'])->latest();

        if (request()->filled('status')) {
            $query->where('status', request('status'));
        }

        if (request()->filled('priority')) {
            $query->where('priority', request('priority'));
        }

        $tickets = $query->paginate(20)->withQueryString();

        return Inertia::render('ControlRoom/Tickets/Index', [
            'tickets' => $tickets,
            'filters' => [
                'statuses' => Ticket::STATUSES,
                'priorities' => Ticket::PRIORITIES,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('ControlRoom/Tickets/Create');
    }

    public function store(Request $request)
    {

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|in:' . implode(',', Ticket::CATEGORIES),
            'priority' => ['required', 'in:' . implode(',', Ticket::PRIORITIES)],
            'description' => 'required|string',
            'client_id' => 'nullable|exists:clients,id',
            'client_site_id' => 'nullable|exists:client_sites,id',
            'due_date' => 'nullable|date',
            'attachments.*' => 'file|max:5120', // max 5MB per file
        ]);

        $ticket = Ticket::create([
            'title' => $validated['title'],
            'category' => $validated['category'],
            'priority' => $validated['priority'],
            'description' => $validated['description'],
            'reported_by' => auth()->id(),
            'status' => 'open',
            'ticket_number' => $this->generateTicketNumber(),
            'due_date' => $validated['due_date'] ?? null,
        ]);

        // Handle attachments (store on public disk and insert attachment rows)
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('ticket-attachments', 'public');
                DB::table('ticket_attachments')->insert([
                    'ticket_id' => $ticket->id,
                    'filename' => $file->getClientOriginalName(),
                    'path' => $path,
                    'mime_type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return redirect()->route('control-room.tickets.show', $ticket)
            ->with('success', 'Ticket created successfully.');
    }

    public function show(Ticket $ticket)
    {
        $ticket->load(['reporter', 'assignedTo', 'client', 'clientSite', 'comments.user']);

        return Inertia::render('ControlRoom/Tickets/Show', [
            'ticket' => $ticket,
        ]);
    }

    public function edit(Ticket $ticket)
    {
        return Inertia::render('ControlRoom/Tickets/Edit', [
            'ticket' => $ticket,
        ]);
    }

    public function update(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:technical_support,service_request,complaint,incident_report,other',
            'priority' => 'required|in:low,medium,high,critical',
            'description' => 'required|string',
            'status' => 'required|in:open,in_progress,resolved,closed',
            'client_id' => 'nullable|exists:clients,id',
            'client_site_id' => 'nullable|exists:client_sites,id',
        ]);

        $ticket->update($validated);

        return redirect()->route('control-room.tickets.show', $ticket)
            ->with('success', 'Ticket updated successfully.');
    }

    public function destroy(Ticket $ticket)
    {
        $ticket->delete();

        return redirect()->route('control-room.tickets.index')
            ->with('success', 'Ticket deleted successfully.');
    }

    public function addComment(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'comment' => 'required|string',
            'is_internal' => 'boolean',
        ]);

        TicketComment::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'comment' => $validated['comment'],
            'is_internal' => $validated['is_internal'] ?? false,
        ]);

        return back()->with('success', 'Comment added successfully.');
    }

    public function assign(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $ticket->update([
            'assigned_to' => $validated['assigned_to'],
            'status' => 'in_progress',
        ]);

        return back()->with('success', 'Ticket assigned successfully.');
    }

    public function close(Request $request, Ticket $ticket)
    {
        $ticket->update([
            'status' => 'closed',
            'closed_at' => now(),
            'closed_by' => auth()->id(),
        ]);

        return back()->with('success', 'Ticket closed successfully.');
    }

    public function reopen(Request $request, Ticket $ticket)
    {
        $ticket->update([
            'status' => 'open',
            'closed_at' => null,
            'closed_by' => null,
        ]);

        return back()->with('success', 'Ticket reopened successfully.');
    }

    private function generateTicketNumber()
    {
        $prefix = 'TKT';
        $year = date('Y');
        $month = date('m');
        
        $lastTicket = Ticket::where('ticket_number', 'like', "{$prefix}-{$year}{$month}%")
            ->orderBy('ticket_number', 'desc')
            ->first();

        if ($lastTicket) {
            $lastNumber = (int) substr($lastTicket->ticket_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return sprintf('%s-%s%s-%04d', $prefix, $year, $month, $newNumber);
    }
}