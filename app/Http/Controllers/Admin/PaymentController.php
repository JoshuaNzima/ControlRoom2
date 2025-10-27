<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClientPayment;
use App\Models\Guards\Client;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $year = (int) ($request->input('year') ?: now()->year);
        $perPage = (int) ($request->input('per_page') ?: 10);
        $sortField = $request->input('sort_field', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
        $siteId = $request->input('site_id');
        $searchTerm = $request->input('search');
        $status = $request->input('status', 'all');

        $query = Client::with(['sites' => function ($query) {
            $query->select('id', 'client_id', 'name', 'address');
        }]);

        // Apply search if provided
        if ($searchTerm) {
            $query->where('name', 'like', "%{$searchTerm}%");
        }

        // Apply site filter if provided
        if ($siteId) {
            $query->whereHas('sites', function ($query) use ($siteId) {
                $query->where('id', $siteId);
            });
        }

        // Note: Status filtering will be done after computing payment summaries
        // This is because we need to determine if a client is late based on their
        // billing window and payment records, which is computed later
        // We'll store the requested status and apply it during summary computation

        // Apply server-side sorting for name field only
        if ($sortField === 'name') {
            $query->orderBy('name', $sortDirection);
        } else {
            $query->orderBy('name', 'asc'); // Default sort
        }

        // Get ALL clients first (before pagination) to compute summaries correctly
        $allClients = $query->get();

        $rawPayments = ClientPayment::where('year', $year)
            ->get(['client_id', 'month', 'paid', 'amount_due', 'amount_paid'])
            ->groupBy('client_id');

        // Build derived payments per client with arrears carry-over and contract window
        $payments = collect();
        foreach ($allClients as $client) {
            $map = [];
            for ($m = 1; $m <= 12; $m++) {
                $map[$m] = [
                    'paid' => false,
                    'amount_due' => 0.0,
                    'amount_paid' => 0.0,
                ];
            }
            $rows = $rawPayments->get($client->id) ?? collect();
            foreach ($rows as $r) {
                $map[(int) $r->month]['paid'] = (bool) $r->paid;
                $map[(int) $r->month]['amount_due'] = (float) $r->amount_due;
                $map[(int) $r->month]['amount_paid'] = (float) $r->amount_paid;
            }

            // Determine billing window: prefer billing_start_date, then contract_start_date, then created_at
            if (!empty($client->billing_start_date)) {
                $billingStart = \Carbon\Carbon::parse($client->billing_start_date);
            } else {
                $billingStart = $client->contract_start_date ? \Carbon\Carbon::parse($client->contract_start_date) : ($client->created_at ? \Carbon\Carbon::parse($client->created_at) : null);
            }
            $contractEnd = $client->contract_end_date ? \Carbon\Carbon::parse($client->contract_end_date) : null;
            $monthlyRate = (float) ($client->monthly_rate ?? 0);

            $carry = 0.0;
            for ($m = 1; $m <= 12; $m++) {
                $ym = \Carbon\Carbon::createFromDate($year, $m, 1);
                $inWindow = true;
                if ($billingStart && $ym->lt($billingStart->copy()->startOfMonth())) {
                    $inWindow = false;
                }
                if ($contractEnd && $ym->gt($contractEnd->copy()->endOfMonth())) {
                    $inWindow = false;
                }

                $baseDue = $inWindow ? $monthlyRate : 0.0;
                // amount due for month is base plus any unpaid carry from previous months in contract window
                $map[$m]['amount_due'] = round($baseDue + $carry, 2);
                if ($map[$m]['paid']) {
                    // Only subtract this month's base from the rolling balance when paid
                    $map[$m]['amount_paid'] = round($baseDue, 2);
                    // Reduce carry by this month's base if any carry exists from previous months
                    $carry = max(0.0, round($carry - $baseDue, 2));
                } else {
                    // Add this month's base to carry if unpaid
                    $carry = round($carry + $baseDue, 2);
                }
            }

            $payments->put($client->id, $map);
        }

        // Compute per-client summaries and flags: clients with 3+ unpaid months up to current month
        $currentYear = now()->year;
        $currentMonth = now()->month;
        $flags = [];
        $summaries = [];
        $totalDueAllClients = 0.0;
        $totalPaidAllClients = 0.0;
        $clientsWithOutstanding = 0;
        $maxOutstandingMonths = 0;
        $overdueClients = collect();

        foreach ($allClients as $client) {
            $clientPayments = $payments->get($client->id) ?? [];
            // Determine billing start month for this year
            $billingStartMonth = 1;
            $billingStartYear = null;
            if (!empty($client->billing_start_date)) {
                $date = \Carbon\Carbon::parse($client->billing_start_date);
                $billingStartYear = $date->year;
                if ($billingStartYear === $year) {
                    $billingStartMonth = $date->month;
                } elseif ($billingStartYear > $year) {
                    $billingStartMonth = 13; // No months to check this year
                }
            } elseif ($client->contract_start_date) {
                $date = \Carbon\Carbon::parse($client->contract_start_date);
                $billingStartYear = $date->year;
                if ($billingStartYear === $year) {
                    $billingStartMonth = $date->month;
                } elseif ($billingStartYear > $year) {
                    $billingStartMonth = 13;
                }
            } elseif ($client->created_at) {
                $date = \Carbon\Carbon::parse($client->created_at);
                $billingStartYear = $date->year;
                if ($billingStartYear === $year) {
                    $billingStartMonth = $date->month;
                } elseif ($billingStartYear > $year) {
                    $billingStartMonth = 13;
                }
            }

            $limitMonth = $year < $currentYear ? 12 : ($year > $currentYear ? 0 : $currentMonth);
            $unpaidCount = 0;
            $totalDue = 0.0;
            $totalPaid = 0.0;
            
            // Only count months from billing start date onwards
            for ($m = $billingStartMonth; $m <= $limitMonth; $m++) {
                $monthState = $clientPayments[$m] ?? ['paid' => false];
                if (!($monthState['paid'] ?? false)) {
                    // Only count as unpaid if there was an amount due
                    if (($clientPayments[$m]['amount_due'] ?? 0) > 0) {
                        $unpaidCount++;
                    }
                }
                $totalDue += (float) ($clientPayments[$m]['amount_due'] ?? 0);
                $totalPaid += (float) ($clientPayments[$m]['amount_paid'] ?? 0);
            }
            if ($unpaidCount >= 3) {
                $flags[$client->id] = true;
            }

            $billingStartStr = !empty($client->billing_start_date) ? (\Carbon\Carbon::parse($client->billing_start_date)->toDateString()) : ($client->contract_start_date ? (\Carbon\Carbon::parse($client->contract_start_date)->toDateString()) : ($client->created_at ? $client->created_at->toDateString() : null));
            $outstandingAmount = round($totalDue - $totalPaid, 2);
            
            $summaries[$client->id] = [
                'expected_amount' => round($totalDue, 2),
                'total_paid' => round($totalPaid, 2),
                'outstanding_amount' => $outstandingAmount,
                'outstanding_months' => $unpaidCount,
                'billing_start' => $billingStartStr,
            ];

            // Update global stats
            $totalDueAllClients += $totalDue;
            $totalPaidAllClients += $totalPaid;
            if ($outstandingAmount > 0) {
                $clientsWithOutstanding++;
                $maxOutstandingMonths = max($maxOutstandingMonths, $unpaidCount);
                if ($unpaidCount >= 3) {
                    $overdueClients->push([
                        'id' => $client->id,
                        'name' => $client->name,
                        'outstanding_amount' => $outstandingAmount,
                        'outstanding_months' => $unpaidCount,
                    ]);
                }
            }
        }

        // Sort overdue clients by outstanding amount
        $overdueClients = $overdueClients->sortByDesc('outstanding_amount')->take(5);

        // Filter clients by status if needed
        $filteredClients = $allClients;
        if ($status && $status !== 'all') {
            $filteredClients = $allClients->filter(function ($client) use ($status, $summaries, $flags) {
                if ($status === 'late') {
                    // Client is late if they have outstanding amount > 0
                    $summary = $summaries[$client->id] ?? null;
                    return $summary && $summary['outstanding_amount'] > 0;
                } elseif ($status === 'paid') {
                    // Client is fully paid if outstanding amount is 0 or less
                    $summary = $summaries[$client->id] ?? null;
                    return $summary && $summary['outstanding_amount'] <= 0;
                }
                return true;
            });
        }

        $totalClients = $allClients->count();

        $overallSummary = [
            'total_clients' => $totalClients,
            'clients_with_outstanding' => $clientsWithOutstanding,
            'clients_overdue_percentage' => $totalClients > 0 ? round(($clientsWithOutstanding / $totalClients) * 100, 1) : 0,
            'total_outstanding' => round($totalDueAllClients - $totalPaidAllClients, 2),
            'max_outstanding_months' => $maxOutstandingMonths,
            'overdue_clients' => $overdueClients->values()->all(),
            'total_due' => round($totalDueAllClients, 2),
            'total_paid' => round($totalPaidAllClients, 2),
            'collection_rate' => $totalDueAllClients > 0 ? round(($totalPaidAllClients / $totalDueAllClients) * 100, 1) : 100,
        ];

        // Get all unique sites for the filter dropdown
        $allSites = \App\Models\ClientSite::select('id', 'name', 'address')
            ->orderBy('name')
            ->get()
            ->map(function ($site) {
                return [
                    'id' => $site->id,
                    'name' => $site->name,
                    'address' => $site->address,
                ];
            });

        // Apply sorting if sorting by computed fields
        $sortedClients = $filteredClients;
        if (in_array($sortField, ['expected_amount', 'outstanding_amount'])) {
            $sortedClients = $filteredClients->sortBy(function ($client) use ($sortField, $summaries) {
                return $summaries[$client->id][$sortField] ?? 0;
            }, SORT_REGULAR, $sortDirection === 'desc');
        }

        // Paginate the filtered and sorted clients
        $currentPage = (int) ($request->input('page', 1));
        $total = $sortedClients->count();
        $paged = $sortedClients->forPage($currentPage, $perPage)->values();

        $clients = new \Illuminate\Pagination\LengthAwarePaginator(
            $paged,
            $total,
            $perPage,
            $currentPage,
            ['path' => request()->url(), 'query' => request()->query()]
        );

        return Inertia::render('Admin/Payments/Index', [
            'year' => $year,
            'clients' => $clients,
            'payments' => $payments,
            'flags' => $flags,
            'summaries' => $summaries,
            'overallSummary' => $overallSummary,
            'sites' => $allSites,
            'filters' => [
                'search' => $searchTerm,
                'site_id' => $siteId,
                'status' => $status,
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'page' => $request->input('page', 1),
            ],
        ]);
    }

    public function toggle(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
            // amount_due removed from UI; backend derives it
        ]);

        $payment = ClientPayment::firstOrCreate([
            'client_id' => $validated['client_id'],
            'year' => $validated['year'],
            'month' => $validated['month'],
        ], [
            'paid' => false,
            'amount_due' => optional(Client::find($validated['client_id']))->getMonthlyDueAmount() ?? 0,
            'amount_paid' => 0,
        ]);

        $newPaid = ! $payment->paid;
        $amountDue = ($payment->amount_due ?: optional($payment->client)->getMonthlyDueAmount() ?: 0);
        $payment->update([
            'paid' => $newPaid,
            'amount_due' => $amountDue,
            'amount_paid' => $newPaid ? $amountDue : 0,
        ]);

        // After toggle, check for delinquency and log
        $year = (int) $validated['year'];
        $clientId = (int) $validated['client_id'];
        $unpaidCount = ClientPayment::where('client_id', $clientId)
            ->where('year', $year)
            ->where('month', '<=', now()->year === $year ? now()->month : 12)
            ->where('paid', false)
            ->count();
        if ($unpaidCount >= 3) {
            Log::warning('Client has 3+ unpaid months', ['client_id' => $clientId, 'year' => $year, 'unpaid_months' => $unpaidCount]);
        }

        return back();
    }
}


