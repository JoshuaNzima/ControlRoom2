<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClientPayment;
use App\Models\ClientSite;
use App\Models\Guards\Client;
use App\Models\Zone;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $year = (int) ($request->input('year') ?: now()->year);
        $perPage = (int) ($request->input('per_page') ?: 20);
        $sortField = $request->input('sort_field', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
        $siteId = $request->input('site_id');
        $zoneId = $request->input('zone_id');
        $searchTerm = $request->input('search');
        $status = $request->input('status', 'all');

        // Build base query with site filter
        $query = Client::with(['sites' => function ($query) {
            $query->select('id', 'client_id', 'name', 'address');
        }]);

        // Apply filters
        if ($searchTerm) {
            $query->where('name', 'like', "%{$searchTerm}%");
        }
        
        if ($siteId) {
            $query->whereHas('sites', function ($query) use ($siteId) {
                $query->where('id', $siteId);
            });
        }

        if ($zoneId) {
            $query->whereHas('sites', function ($query) use ($zoneId) {
                $query->where('zone_id', $zoneId);
            });
        }

        // Apply payment status filter using the scope
        if ($status && $status !== 'all') {
            $query->byPaymentStatus($status, $year);
        }

        // Calculate payment aggregates using raw SQL for efficiency
        $aggregates = DB::table('clients')
            ->leftJoin('client_payments', function ($join) use ($year) {
                $join->on('clients.id', '=', 'client_payments.client_id')
                    ->where('client_payments.year', '=', $year)
                    ->where('client_payments.month', '<=', now()->year === $year ? now()->month : 12);
            })
            ->select([
                DB::raw('COUNT(DISTINCT clients.id) as total_clients'),
                DB::raw('SUM(client_payments.amount_due) as total_due'),
                DB::raw('SUM(client_payments.amount_paid) as total_paid'),
                DB::raw('COUNT(DISTINCT CASE WHEN client_payments.amount_due > client_payments.amount_paid THEN clients.id END) as clients_with_outstanding')
            ])
            ->first();

        // Get top 5 overdue clients
        $overdueClients = $query->clone()
            ->withOverduePayments($year)
            ->select(['id', 'name'])
            ->withSum(['payments as outstanding_amount' => function ($query) use ($year) {
                $query->where('year', $year)
                    ->whereRaw('amount_due > amount_paid');
            }], DB::raw('amount_due - amount_paid'))
            ->orderByDesc('outstanding_amount')
            ->take(5)
            ->get();

        // Apply sorting and get paginated results
        $query = match ($sortField) {
            'expected_amount' => $query->withSum(['payments' => function ($query) use ($year) {
                $query->where('year', $year);
            }], 'amount_due')->orderBy('payments_sum_amount_due', $sortDirection),
            'outstanding_amount' => $query->withSum(['payments' => function ($query) use ($year) {
                $query->where('year', $year);
            }], DB::raw('amount_due - amount_paid'))->orderBy('payments_sum_amount_due_minus_amount_paid', $sortDirection),
            default => $query->orderBy('name', $sortDirection)
        };

        $clients = $query->paginate($perPage);

        // Get payment maps for the current page
        $clientIds = $clients->pluck('id');
        $payments = ClientPayment::where('year', $year)
            ->whereIn('client_id', $clientIds)
            ->get(['client_id', 'month', 'paid', 'amount_due', 'amount_paid'])
            ->groupBy('client_id')
            ->map(function ($clientPayments) {
                $map = array_fill(1, 12, ['paid' => false, 'amount_due' => 0.0, 'amount_paid' => 0.0]);
                foreach ($clientPayments as $payment) {
                    $map[$payment->month] = [
                        'paid' => (bool) $payment->paid,
                        'amount_due' => (float) $payment->amount_due,
                        'amount_paid' => (float) $payment->amount_paid
                    ];
                }
                return $map;
            });

        // Calculate summaries for the current page
        $summaries = [];
        foreach ($clients as $client) {
            $summaries[$client->id] = $client->getPaymentSummary($year);
        }

        // Get flags for clients with 3+ unpaid months
        $flags = array_filter($summaries, fn($s) => $s['is_overdue']);
        $flags = array_combine(array_keys($flags), array_fill(0, count($flags), true));

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
                // Ensure we have a reliable monthly rate even if not stored on the model
                $monthlyRate = (float) ($client->monthly_rate ?? optional($client)->getMonthlyDueAmount() ?? 0);

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
        $overallSummary = [
            'total_clients' => $aggregates->total_clients,
            'clients_with_outstanding' => $aggregates->clients_with_outstanding,
            'clients_overdue_percentage' => $aggregates->total_clients > 0 ? 
                round(($aggregates->clients_with_outstanding / $aggregates->total_clients) * 100, 1) : 0,
            'total_outstanding' => round(($aggregates->total_due ?? 0) - ($aggregates->total_paid ?? 0), 2),
            'max_outstanding_months' => DB::table('client_payments')
                ->where('year', $year)
                ->where('paid', false)
                ->groupBy('client_id')
                ->count(),
            'overdue_clients' => $overdueClients,
            'total_due' => round($aggregates->total_due ?? 0, 2),
            'total_paid' => round($aggregates->total_paid ?? 0, 2),
            'collection_rate' => $aggregates->total_due > 0 ? 
                round(($aggregates->total_paid / $aggregates->total_due) * 100, 1) : 100,
        ];

        return Inertia::render('Admin/Payments/Index', [
            'year' => $year,
            'clients' => $clients,
            'payments' => $payments,
            'flags' => $flags,
            'summaries' => $summaries,
            'overallSummary' => $overallSummary,
            'sites' => ClientSite::select('id', 'name', 'address')->orderBy('name')->get(),
            'zones' => Zone::select('id', 'name')->orderBy('name')->get(),
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
        ]);

        $client = Client::findOrFail($validated['client_id']);
        $amountDue = $client->getMonthlyDueAmount();

        $payment = ClientPayment::firstOrCreate([
            'client_id' => $validated['client_id'],
            'year' => $validated['year'],
            'month' => $validated['month'],
        ], [
            'paid' => false,
            'amount_due' => $amountDue,
            'amount_paid' => 0,
        ]);

        $newPaid = !$payment->paid;
        $payment->update([
            'paid' => $newPaid,
            'amount_due' => $amountDue,
            'amount_paid' => $newPaid ? $amountDue : 0,
        ]);

        // Check for delinquency
        $unpaidCount = ClientPayment::where('client_id', $validated['client_id'])
            ->where('year', $validated['year'])
            ->where('month', '<=', now()->year === $validated['year'] ? now()->month : 12)
            ->where('paid', false)
            ->count();

        if ($unpaidCount >= 3) {
            Log::warning('Client has 3+ unpaid months', [
                'client_id' => $validated['client_id'],
                'year' => $validated['year'],
                'unpaid_months' => $unpaidCount
            ]);
        }

        return back();
    }
}


