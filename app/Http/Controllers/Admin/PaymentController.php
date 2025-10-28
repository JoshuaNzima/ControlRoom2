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
    // Default to 20 per page to match other index pages in the app
    $perPage = (int) ($request->input('per_page') ?: 20);
        $sortField = $request->input('sort_field', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
    $siteId = $request->input('site_id');
    $zoneId = $request->input('zone_id');
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

        // Apply zone filter if provided (clients who have at least one site in the zone)
        if ($zoneId) {
            $query->whereHas('sites', function ($query) use ($zoneId) {
                $query->where('zone_id', $zoneId);
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

        // We'll paginate the clients for display but compute global summaries in chunks
        $currentPage = (int) ($request->input('page', 1));
        $totalClients = $query->count();

        // Prepare containers
        $payments = collect();
        $flags = [];
        $summaries = [];
        $clientMinimal = []; // store small client info for sorting/filtering without loading relations

        // We'll compute global aggregates by chunking all clients to avoid loading all at once.
        $totalDueAllClients = 0.0;
        $totalPaidAllClients = 0.0;
        $clientsWithOutstanding = 0;
        $maxOutstandingMonths = 0;
        $overdueClients = collect();

        // Chunk through clients matching the same filters to compute summary aggregates
        $chunkSelect = ['id', 'name', 'monthly_rate', 'billing_start_date', 'contract_start_date', 'contract_end_date', 'created_at'];
        $chunkQuery = (clone $query)->select($chunkSelect)->orderBy('id');
        $chunkQuery->chunkById(100, function ($clientsChunk) use ($year, &$totalDueAllClients, &$totalPaidAllClients, &$clientsWithOutstanding, &$maxOutstandingMonths, &$overdueClients, &$clientMinimal, &$summaries, &$flags) {
            $clientIds = $clientsChunk->pluck('id')->all();

            // Fetch payments only for this chunk of clients
            $rawPayments = ClientPayment::where('year', $year)
                ->whereIn('client_id', $clientIds)
                ->get(['client_id', 'month', 'paid', 'amount_due', 'amount_paid'])
                ->groupBy('client_id');

            foreach ($clientsChunk as $client) {
                // store minimal info for sorting/filtering later (small footprint)
                $clientMinimal[$client->id] = [
                    'id' => $client->id,
                    'name' => $client->name,
                    'monthly_rate' => $client->monthly_rate ?? 0,
                    'billing_start_date' => $client->billing_start_date,
                    'contract_start_date' => $client->contract_start_date,
                    'contract_end_date' => $client->contract_end_date,
                    'created_at' => $client->created_at,
                ];
                $map = [];
                for ($m = 1; $m <= 12; $m++) {
                    $map[$m] = ['paid' => false, 'amount_due' => 0.0, 'amount_paid' => 0.0];
                }
                $rows = $rawPayments->get($client->id) ?? collect();
                foreach ($rows as $r) {
                    $map[(int) $r->month]['paid'] = (bool) $r->paid;
                    $map[(int) $r->month]['amount_due'] = (float) $r->amount_due;
                    $map[(int) $r->month]['amount_paid'] = (float) $r->amount_paid;
                }

                // Determine billing window
                if (!empty($client->billing_start_date)) {
                    $billingStart = \Carbon\Carbon::parse($client->billing_start_date);
                } else {
                    $billingStart = $client->contract_start_date ? \Carbon\Carbon::parse($client->contract_start_date) : ($client->created_at ? \Carbon\Carbon::parse($client->created_at) : null);
                }
                $contractEnd = $client->contract_end_date ? \Carbon\Carbon::parse($client->contract_end_date) : null;
                $monthlyRate = (float) ($client->monthly_rate ?? 0);

                $carry = 0.0;
                $currentYear = now()->year;
                $currentMonth = now()->month;
                $limitMonth = $year < $currentYear ? 12 : ($year > $currentYear ? 0 : $currentMonth);

                $unpaidCount = 0;
                $totalDue = 0.0;
                $totalPaid = 0.0;

                // Only count months from billing start date onwards
                $billingStartMonth = 1;
                $billingStartYear = null;
                if (!empty($client->billing_start_date)) {
                    $date = \Carbon\Carbon::parse($client->billing_start_date);
                    $billingStartYear = $date->year;
                    if ($billingStartYear === $year) {
                        $billingStartMonth = $date->month;
                    } elseif ($billingStartYear > $year) {
                        $billingStartMonth = 13;
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

                for ($m = $billingStartMonth; $m <= $limitMonth; $m++) {
                    $monthState = $map[$m] ?? ['paid' => false, 'amount_due' => 0, 'amount_paid' => 0];
                    // Determine base due using window logic
                    $ym = \Carbon\Carbon::createFromDate($year, $m, 1);
                    $inWindow = true;
                    if ($billingStart && $ym->lt($billingStart->copy()->startOfMonth())) {
                        $inWindow = false;
                    }
                    if ($contractEnd && $ym->gt($contractEnd->copy()->endOfMonth())) {
                        $inWindow = false;
                    }
                    $baseDue = $inWindow ? $monthlyRate : 0.0;

                    // Rolling carry logic: if month was paid, assume it covered base due; otherwise add base due to carry.
                    $computedDue = round($baseDue, 2);
                    $computedPaid = ($monthState['paid'] ?? false) ? min($computedDue, (float) ($monthState['amount_paid'] ?? 0)) : 0.0;

                    if (!($monthState['paid'] ?? false)) {
                        if (($monthState['amount_due'] ?? 0) > 0) {
                            $unpaidCount++;
                        }
                    }

                    $totalDue += (float) ($monthState['amount_due'] ?? $computedDue);
                    $totalPaid += (float) ($monthState['amount_paid'] ?? $computedPaid);
                }

                if ($unpaidCount >= 3) {
                    $flags[$client->id] = true;
                }

                $billingStartStr = !empty($client->billing_start_date) ? (\Carbon\Carbon::parse($client->billing_start_date)->toDateString()) : ($client->contract_start_date ? (\Carbon\Carbon::parse($client->contract_start_date)->toDateString()) : ($client->created_at ? $client->created_at->toDateString() : null));
                $outstandingAmount = round($totalDue - $totalPaid, 2);

                // Update global stats
                $totalDueAllClients += $totalDue;
                $totalPaidAllClients += $totalPaid;
                if ($outstandingAmount > 0) {
                    $clientsWithOutstanding++;
                    $maxOutstandingMonths = max($maxOutstandingMonths, $unpaidCount);
                    if ($unpaidCount >= 3) {
                        $overdueClients->push(['id' => $client->id, 'name' => $client->name, 'outstanding_amount' => $outstandingAmount, 'outstanding_months' => $unpaidCount]);
                    }
                }

                // store the small summary for this client (used for filtering/sorting)
                $summaries[$client->id] = [
                    'expected_amount' => round($totalDue, 2),
                    'total_paid' => round($totalPaid, 2),
                    'outstanding_amount' => $outstandingAmount,
                    'outstanding_months' => $unpaidCount,
                    'billing_start' => $billingStartStr,
                ];
            }
        });

        // After chunking we have summaries and minimal info for all clients matching filters.
        // Now apply status filtering and sorting on the lightweight summaries, then fetch page models (with sites) only for the current page.

        // Build a list of client IDs in the order determined by sortField/sortDirection
        $clientIds = array_keys($clientMinimal);

        // Filter by status (late/paid) using computed summaries
        if ($status && $status !== 'all') {
            $clientIds = array_values(array_filter($clientIds, function ($id) use ($status, $summaries) {
                $summary = $summaries[$id] ?? null;
                if (!$summary) return false;
                if ($status === 'late') return $summary['outstanding_amount'] > 0;
                if ($status === 'paid') return $summary['outstanding_amount'] <= 0;
                return true;
            }));
        }

        // Sort client IDs by requested field
        if (in_array($sortField, ['expected_amount', 'outstanding_amount'])) {
            usort($clientIds, function ($a, $b) use ($summaries, $sortField, $sortDirection) {
                $va = $summaries[$a][$sortField] ?? 0;
                $vb = $summaries[$b][$sortField] ?? 0;
                if ($va == $vb) return 0;
                $res = ($va < $vb) ? -1 : 1;
                return $sortDirection === 'desc' ? -$res : $res;
            });
        } else {
            // Sort by name using minimal info
            usort($clientIds, function ($a, $b) use ($clientMinimal, $sortDirection) {
                $na = strtolower($clientMinimal[$a]['name'] ?? '');
                $nb = strtolower($clientMinimal[$b]['name'] ?? '');
                if ($na == $nb) return 0;
                $res = ($na < $nb) ? -1 : 1;
                return $sortDirection === 'desc' ? -$res : $res;
            });
        }

        $total = count($clientIds);
        $pagedIds = array_slice($clientIds, ($currentPage - 1) * $perPage, $perPage);

        // Fetch full client models for the page (including sites)
        $pagedClients = collect();
        if (!empty($pagedIds)) {
            $fetched = Client::with(['sites' => function ($q) { $q->select('id','client_id','name','address'); }])->whereIn('id', $pagedIds)->get()->keyBy('id');
            // reorder according to $pagedIds
            foreach ($pagedIds as $id) {
                if (isset($fetched[$id])) $pagedClients->push($fetched[$id]);
            }
        }

        // Build detailed month maps only for clients on this page
        if (!empty($pagedIds)) {
            $pagePayments = ClientPayment::where('year', $year)->whereIn('client_id', $pagedIds)->get(['client_id','month','paid','amount_due','amount_paid'])->groupBy('client_id');
            foreach ($pagedIds as $cid) {
                $map = [];
                for ($m = 1; $m <= 12; $m++) {
                    $map[$m] = ['paid' => false, 'amount_due' => 0.0, 'amount_paid' => 0.0];
                }
                $rows = $pagePayments->get($cid) ?? collect();
                foreach ($rows as $r) {
                    $map[(int)$r->month]['paid'] = (bool)$r->paid;
                    $map[(int)$r->month]['amount_due'] = (float)$r->amount_due;
                    $map[(int)$r->month]['amount_paid'] = (float)$r->amount_paid;
                }
                $payments->put($cid, $map);
            }
        }

        // Sort overdue clients by outstanding amount and take top 5
        $overdueClients = $overdueClients->sortByDesc('outstanding_amount')->take(5);

        // Total clients (after status filtering) computed earlier
        // $total already computed above

        $overallSummary = [
            'total_clients' => $total,
            'clients_with_outstanding' => $clientsWithOutstanding,
            'clients_overdue_percentage' => $total > 0 ? round(($clientsWithOutstanding / $total) * 100, 1) : 0,
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

        // Also provide zones for filtering by zone (client_sites have zone_id)
        $allZones = \App\Models\Zone::select('id', 'name')->orderBy('name')->get();

        // Build paginator from the paged clients we fetched earlier
        $currentPage = (int) ($request->input('page', 1));
        $clients = new \Illuminate\Pagination\LengthAwarePaginator(
            $pagedClients->values(),
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
            'zones' => $allZones,
            'filters' => [
                'search' => $searchTerm,
                'site_id' => $siteId,
                'zone_id' => $zoneId,
                'status' => $status,
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'page' => $request->input('page', 1),
                'per_page' => $perPage,
                'year' => $year,
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


