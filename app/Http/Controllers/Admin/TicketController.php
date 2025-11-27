<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $query = Ticket::query()->latest();

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }
        if ($priority = $request->string('priority')->toString()) {
            $query->where('priority', $priority);
        }
        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('ticket_number', 'like', "%{$search}%");
            });
        }

        $tickets = $query->paginate(15)->withQueryString();
        $user = auth()->user();

        return Inertia::render('Admin/FrontDeskTickets', [
            'tickets' => $tickets,
            'filters' => [
                'status' => $status,
                'priority' => $priority,
                'search' => $search,
            ],
            'options' => [
                'statuses' => Ticket::STATUSES,
                'priorities' => Ticket::PRIORITIES,
                'categories' => Ticket::CATEGORIES,
                'users' => User::orderBy('name')->get(['id','name']),
            ],
            'auth' => [
                'user' => [
                    'name' => $user?->name,
                ],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['reported_by'] = auth()->id();
        $data['status'] = $data['status'] ?? 'open';
        $ticket = Ticket::create($data);
        return redirect()->route('admin.front-desk.tickets.index');
    }

    public function update(Request $request, Ticket $ticket)
    {
        $data = $this->validateData($request, true);
        $ticket->update($data);
        return redirect()->route('admin.front-desk.tickets.index');
    }

    public function destroy(Ticket $ticket)
    {
        $ticket->delete();
        return redirect()->route('admin.front-desk.tickets.index');
    }

    public function showJson(Ticket $ticket)
    {
        return response()->json($ticket);
    }

    protected function validateData(Request $request, bool $update = false): array
    {
        return $request->validate([
            'title' => ['required','string','max:255'],
            'category' => ['required','in:' . implode(',', Ticket::CATEGORIES)],
            'priority' => ['required','in:' . implode(',', Ticket::PRIORITIES)],
            'description' => ['nullable','string'],
            'status' => ['nullable','in:' . implode(',', Ticket::STATUSES)],
            'assigned_to' => ['nullable','integer','exists:users,id'],
        ]);
    }
}
