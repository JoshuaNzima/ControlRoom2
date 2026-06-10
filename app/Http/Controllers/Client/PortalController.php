<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Guards\Client;
use App\Models\Guards\Attendance;
use App\Models\Guards\Shift;
use App\Models\Incident;
use App\Models\Invoice;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class PortalController extends Controller
{
    /**
     * Get the client's linked client ID
     */
    private function getClientId(): ?int
    {
        $user = auth()->user();
        $linkedClientIds = DB::table('client_user')
            ->where('user_id', $user->id)
            ->pluck('client_id');

        return $linkedClientIds->first();
    }

    /**
     * Client sites page
     */
    public function sites()
    {
        $user = auth()->user();
        $clientId = $this->getClientId();

        if (!$clientId) {
            return Inertia::render('Client/Sites', [
                'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
                'client' => null,
                'sites' => [],
            ]);
        }

        $client = Client::find($clientId);
        $sites = $client->sites()
            ->with(['zone:id,name'])
            ->orderBy('name')
            ->get();

        // Get guards on duty per site
        $siteIds = $sites->pluck('id');
        $guardsOnDuty = Attendance::with(['guardRelation:id,name,phone,position'])
            ->whereIn('client_site_id', $siteIds)
            ->whereDate('date', today())
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time')
            ->get()
            ->groupBy('client_site_id');

        // Get today's shifts per site
        $todayShifts = \App\Models\Guards\Shift::whereIn('client_site_id', $siteIds)
            ->whereDate('date', today())
            ->get()
            ->groupBy('client_site_id');

        return Inertia::render('Client/Sites', [
            'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
            'client' => ['id' => $client->id, 'name' => $client->name],
            'sites' => $sites->map(fn($site) => [
                'id' => $site->id,
                'name' => $site->name,
                'address' => $site->address,
                'contact_person' => $site->contact_person,
                'phone' => $site->phone,
                'required_guards' => $site->required_guards,
                'status' => $site->status,
                'site_type' => $site->site_type,
                'zone_name' => $site->zone?->name,
                'latitude' => $site->latitude,
                'longitude' => $site->longitude,
                'checkpoints_count' => $site->checkpoints()->count(),
                'active_guards' => $guardsOnDuty->get($site->id)?->count() ?? 0,
                'scheduled_shifts' => $todayShifts->get($site->id)?->count() ?? 0,
                'guards_on_duty' => $guardsOnDuty->get($site->id)?->map(fn($att) => [
                    'id' => $att->id,
                    'guard_id' => $att->guard_id,
                    'guard_name' => $att->guardRelation?->name,
                    'position' => $att->guardRelation?->position,
                    'check_in_time' => $att->check_in_time?->format('H:i'),
                    'status' => $att->status,
                ])->values() ?? [],
            ]),
        ]);
    }

    /**
     * Client reports/incidents page
     */
    public function reports()
    {
        $user = auth()->user();
        $clientId = $this->getClientId();

        if (!$clientId) {
            return Inertia::render('Client/Reports', [
                'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
                'client' => null,
                'incidents' => [],
            ]);
        }

        $client = Client::find($clientId);
        $siteIds = $client->sites()->pluck('id');

        $incidents = Incident::with(['clientSite:id,name', 'guardRelation:id,name'])
            ->whereIn('client_site_id', $siteIds)
            ->orderBy('created_at', 'desc')
            ->get([
                'id', 'title', 'description', 'type', 'severity', 'status',
                'client_site_id', 'guard_id', 'created_at', 'resolved_at'
            ]);

        return Inertia::render('Client/Reports', [
            'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
            'client' => ['id' => $client->id, 'name' => $client->name],
            'incidents' => $incidents->map(fn($incident) => [
                'id' => $incident->id,
                'title' => $incident->title,
                'description' => $incident->description,
                'type' => $incident->type,
                'severity' => $incident->severity,
                'status' => $incident->status,
                'site_name' => $incident->clientSite?->name,
                'guard_name' => $incident->guardRelation?->name,
                'created_at' => $incident->created_at,
                'resolved_at' => $incident->resolved_at,
            ]),
        ]);
    }

    /**
     * Client invoices page
     */
    public function invoices()
    {
        $user = auth()->user();
        $clientId = $this->getClientId();

        if (!$clientId) {
            return Inertia::render('Client/Invoices', [
                'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
                'client' => null,
                'invoices' => [],
                'paymentSummary' => null,
            ]);
        }

        $client = Client::find($clientId);

        $invoices = Invoice::where('client_id', $client->id)
            ->orderBy('created_at', 'desc')
            ->with(['payments.recordedBy:id,name'])
            ->get([
                'id', 'invoice_number', 'total_amount', 'status',
                'due_date', 'billing_month', 'billing_year', 'created_at'
            ]);

        $paymentSummary = $client->getPaymentSummary(now()->year);

        return Inertia::render('Client/Invoices', [
            'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'monthly_rate' => $client->monthly_rate,
            ],
            'invoices' => $invoices->map(fn($invoice) => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'total_amount' => $invoice->total_amount,
                'status' => $invoice->status,
                'due_date' => $invoice->due_date,
                'billing_month' => $invoice->billing_month,
                'billing_year' => $invoice->billing_year,
                'billing_period' => $invoice->billing_month && $invoice->billing_year
                    ? "{$invoice->billing_month}/{$invoice->billing_year}"
                    : null,
                'created_at' => $invoice->created_at,
                'paid_date' => $invoice->paid_date,
                'payments' => $invoice->payments->map(fn($p) => [
                    'id' => $p->id,
                    'amount' => $p->amount,
                    'payment_date' => $p->payment_date,
                    'payment_method' => $p->payment_method,
                    'reference' => $p->reference,
                    'notes' => $p->notes,
                    'recorded_by' => $p->recordedBy ? [
                        'id' => $p->recordedBy->id,
                        'name' => $p->recordedBy->name,
                    ] : null,
                ])->values(),
              ]),
            'paymentSummary' => $paymentSummary ? [
                'expected_amount' => $paymentSummary['expected_amount'] ?? 0,
                'total_due' => $paymentSummary['total_due'] ?? 0,
                'total_paid' => $paymentSummary['total_paid'] ?? 0,
                'outstanding_amount' => $paymentSummary['outstanding_amount'] ?? 0,
                'outstanding_months' => $paymentSummary['outstanding_months'] ?? 0,
                'is_overdue' => $paymentSummary['is_overdue'] ?? false,
            ] : null,
        ]);
    }

    /**
     * Client shift schedules page
     */
    public function schedules(Request $request)
    {
        $user = auth()->user();
        $clientId = $this->getClientId();

        if (!$clientId) {
            return Inertia::render('Client/Schedules', [
                'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
                'client' => null,
                'shifts' => [],
                'sites' => [],
            ]);
        }

        $client = Client::find($clientId);
        $sites = $client->sites()->where('status', 'active')->get(['id', 'name']);
        $siteIds = $sites->pluck('id');

        // Get date range (default to current week)
        $startDate = $request->get('start_date', now()->startOfWeek()->toDateString());
        $endDate = $request->get('end_date', now()->endOfWeek()->toDateString());

        $shifts = Shift::with(['guardRelation:id,name,phone,position', 'clientSite:id,name'])
            ->whereIn('client_site_id', $siteIds)
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate)
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return Inertia::render('Client/Schedules', [
            'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
            'client' => ['id' => $client->id, 'name' => $client->name],
            'shifts' => $shifts->map(fn($shift) => [
                'id' => $shift->id,
                'guard_id' => $shift->guard_id,
                'guard_name' => $shift->guardRelation?->name,
                'guard_phone' => $shift->guardRelation?->phone,
                'position' => $shift->guardRelation?->position,
                'site_id' => $shift->client_site_id,
                'site_name' => $shift->clientSite?->name,
                'date' => $shift->date?->toDateString(),
                'start_time' => $shift->start_time?->format('H:i'),
                'end_time' => $shift->end_time?->format('H:i'),
                'shift_type' => $shift->shift_type,
                'status' => $shift->status,
                'status_color' => $shift->status_color,
                'is_late' => $shift->is_late,
                'actual_start_time' => $shift->actual_start_time?->format('H:i'),
                'actual_end_time' => $shift->actual_end_time?->format('H:i'),
            ]),
            'sites' => $sites->map(fn($site) => [
                'id' => $site->id,
                'name' => $site->name,
            ]),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Client profile page
     */
    public function profile()
    {
        $user = auth()->user();
        $clientId = $this->getClientId();

        $client = $clientId ? Client::with(['supervisor:id,name,email,phone', 'sergeant:id,name,phone'])->find($clientId) : null;

        return Inertia::render('Client/Profile', [
            'auth' => ['user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ]],
            'client' => $client ? [
                'id' => $client->id,
                'name' => $client->name,
                'contact_person' => $client->contact_person,
                'email' => $client->email,
                'phone' => $client->phone,
                'address' => $client->address,
                'contract_start_date' => $client->contract_start_date?->toDateString(),
                'contract_end_date' => $client->contract_end_date?->toDateString(),
                'monthly_rate' => $client->getMonthlyDueAmount(),
                'status' => $client->status,
                'supervisor' => $client->supervisor ? [
                    'name' => $client->supervisor->name,
                    'email' => $client->supervisor->email,
                    'phone' => $client->supervisor->phone,
                ] : null,
                'sergeant' => $client->sergeant ? [
                    'name' => $client->sergeant->name,
                    'phone' => $client->sergeant->phone,
                ] : null,
            ] : null,
        ]);
    }

    /**
     * Update client user profile
     */
    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $user->update($validated);

        return redirect()->back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Update client user password
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = auth()->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return redirect()->back()->withErrors(['current_password' => 'The current password is incorrect.']);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return redirect()->back()->with('success', 'Password updated successfully.');
    }

    /**
     * Client support tickets page
     */
    public function support()
    {
        $user = auth()->user();
        $clientId = $this->getClientId();

        if (!$clientId) {
            return Inertia::render('Client/Support', [
                'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
                'client' => null,
                'tickets' => [],
            ]);
        }

        $client = Client::find($clientId);

        // Get tickets for this client (from client_user relationship)
        $tickets = SupportTicket::where('user_id', $user->id)
            ->orWhere('client_id', $clientId)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Client/Support', [
            'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
            'client' => ['id' => $client->id, 'name' => $client->name],
            'tickets' => $tickets->map(fn($ticket) => [
                'id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'subject' => $ticket->subject,
                'category' => $ticket->category,
                'priority' => $ticket->priority,
                'status' => $ticket->status,
                'created_at' => $ticket->created_at->toISOString(),
                'updated_at' => $ticket->updated_at->toISOString(),
            ]),
        ]);
    }

    /**
     * Store a new support ticket
     */
    public function storeTicket(Request $request)
    {
        $user = auth()->user();
        $clientId = $this->getClientId();

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'category' => 'required|string|in:technical,billing,security,general',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'message' => 'required|string|max:5000',
        ]);

        $ticketNumber = 'TKT-' . strtoupper(uniqid());

        $ticket = SupportTicket::create([
            'ticket_number' => $ticketNumber,
            'user_id' => $user->id,
            'client_id' => $clientId,
            'subject' => $validated['subject'],
            'category' => $validated['category'],
            'priority' => $validated['priority'],
            'status' => 'open',
        ]);

        // Create the initial reply/message
        SupportTicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'message' => $validated['message'],
            'is_internal' => false,
        ]);

        return redirect()->route('client.support.show', $ticket->id)->with('success', 'Support ticket created successfully.');
    }

    /**
     * Show a specific support ticket
     */
    public function showTicket($ticketId)
    {
        $user = auth()->user();
        $clientId = $this->getClientId();

        $ticket = SupportTicket::with(['replies.user:id,name'])
            ->where('id', $ticketId)
            ->where(function ($query) use ($user, $clientId) {
                $query->where('user_id', $user->id)
                    ->orWhere('client_id', $clientId);
            })
            ->firstOrFail();

        return Inertia::render('Client/SupportDetail', [
            'auth' => ['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]],
            'ticket' => [
                'id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'subject' => $ticket->subject,
                'category' => $ticket->category,
                'priority' => $ticket->priority,
                'status' => $ticket->status,
                'created_at' => $ticket->created_at->toISOString(),
                'updated_at' => $ticket->updated_at->toISOString(),
                'replies' => $ticket->replies->map(fn($reply) => [
                    'id' => $reply->id,
                    'user_name' => $reply->user?->name,
                    'message' => $reply->message,
                    'is_internal' => $reply->is_internal,
                    'created_at' => $reply->created_at->toISOString(),
                ]),
            ],
        ]);
    }

    /**
     * Reply to a support ticket
     */
    public function replyTicket(Request $request, $ticketId)
    {
        $user = auth()->user();
        $clientId = $this->getClientId();

        $ticket = SupportTicket::where('id', $ticketId)
            ->where(function ($query) use ($user, $clientId) {
                $query->where('user_id', $user->id)
                    ->orWhere('client_id', $clientId);
            })
            ->firstOrFail();

        $validated = $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        SupportTicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'message' => $validated['message'],
            'is_internal' => false,
        ]);

        // Update ticket status if it was closed
        if ($ticket->status === 'closed') {
            $ticket->update(['status' => 'open']);
        }

        return redirect()->back()->with('success', 'Reply added successfully.');
    }

    /**
     * Client settings page
     */
    public function settings()
    {
        $user = auth()->user();
        $clientId = $this->getClientId();

        $client = $clientId ? Client::find($clientId) : null;

        // Get user's notification preferences (stored in settings JSON column or separate table)
        $settings = $user->settings ?? [];

        return Inertia::render('Client/Settings', [
            'auth' => ['user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ]],
            'client' => $client ? [
                'id' => $client->id,
                'name' => $client->name,
            ] : null,
            'settings' => [
                'email_notifications' => $settings['email_notifications'] ?? true,
                'sms_notifications' => $settings['sms_notifications'] ?? false,
                'push_notifications' => $settings['push_notifications'] ?? true,
                'incident_alerts' => $settings['incident_alerts'] ?? true,
                'shift_reminders' => $settings['shift_reminders'] ?? true,
                'invoice_reminders' => $settings['invoice_reminders'] ?? true,
                'report_notifications' => $settings['report_notifications'] ?? true,
                'language' => $settings['language'] ?? 'en',
                'timezone' => $settings['timezone'] ?? 'Africa/Blantyre',
                'date_format' => $settings['date_format'] ?? 'd/m/Y',
            ],
        ]);
    }

    /**
     * Update client user settings
     */
    public function updateSettings(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'email_notifications' => 'boolean',
            'sms_notifications' => 'boolean',
            'push_notifications' => 'boolean',
            'incident_alerts' => 'boolean',
            'shift_reminders' => 'boolean',
            'invoice_reminders' => 'boolean',
            'report_notifications' => 'boolean',
            'language' => 'string|in:en',
            'timezone' => 'string|timezone',
            'date_format' => 'string|in:d/m/Y,m/d/Y,Y-m-d',
        ]);

        // Store settings in user's settings JSON column
        $user->settings = array_merge($user->settings ?? [], $validated);
        $user->save();

        return redirect()->back()->with('success', 'Settings updated successfully.');
    }
}
