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
use Illuminate\Pagination\LengthAwarePaginator;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $year = (int) ($request->input('year') ?: now()->year);
        $now = now();
        $currentYear = (int) $now->year;
        $currentMonth = (int) $now->month;
        $limitMonth = $year < $currentYear ? 12 : ($year > $currentYear ? 0 : $currentMonth);
        $perPage = (int) ($request->input('per_page') ?: 20);
        $sortField = $request->input('sort_field', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
        $siteId = $request->input('site_id');
        $zoneId = $request->input('zone_id');
        $searchTerm = $request->input('search');
        $status = $request->input('status', 'all');

        // Build base query with site filter
        $query = Client::query();

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

        // Calculate payment aggregates using raw SQL for efficiency
        // NOTE: We compute the user-visible aggregates using the same billing logic as per-client summaries,
        // to ensure totals still show even when rows don't exist yet in client_payments.
        $aggregates = (object) [
            'total_clients' => 0,
            'total_due' => 0,
            'total_paid' => 0,
            'total_covered' => 0,
            'clients_with_outstanding' => 0,
        ];

        // Get top 5 overdue clients
        $overdueClients = collect();
        $clientMinimal = [];

        // Apply sorting and get paginated results
        $summaries = [];
        $flags = [];

        // Chunk through clients matching the same filters to compute summary aggregates
        $totalDueAllClients = 0.0;
        $totalPaidAllClients = 0.0;
        $totalCoveredAllClients = 0.0;
        $clientsWithOutstanding = 0;
        $maxOutstandingMonths = 0;
        $chunkSelect = ['id', 'name', 'monthly_rate', 'billing_start_date', 'contract_start_date', 'contract_end_date', 'created_at'];
        $chunkQuery = (clone $query)->select($chunkSelect)->orderBy('id');
        $chunkQuery->chunkById(100, function ($clientsChunk) use ($year, &$totalDueAllClients, &$totalPaidAllClients, &$totalCoveredAllClients, &$clientsWithOutstanding, &$maxOutstandingMonths, &$overdueClients, &$clientMinimal, &$summaries, &$flags, $limitMonth) {
            $clientIds = $clientsChunk->pluck('id')->all();

            // Fetch payments only for this chunk of clients
            $rawPayments = ClientPayment::where('year', $year)
                ->whereIn('client_id', $clientIds)
                ->get(['client_id', 'month', 'paid', 'amount_due', 'amount_paid', 'prepaid_amount'])
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
                    $map[$m] = ['paid' => false, 'amount_due' => 0.0, 'amount_paid' => 0.0, 'prepaid_amount' => 0.0];
                }
                $rows = $rawPayments->get($client->id) ?? collect();
                foreach ($rows as $r) {
                    $map[(int) $r->month]['paid'] = (bool) $r->paid;
                    $map[(int) $r->month]['amount_due'] = (float) $r->amount_due;
                    $map[(int) $r->month]['amount_paid'] = (float) $r->amount_paid;
                    $map[(int) $r->month]['prepaid_amount'] = (float) $r->prepaid_amount;
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

                $unpaidCount = 0;
                $totalDue = 0.0;
                $totalPaid = 0.0;
                $totalCovered = 0.0;

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
                    $monthState = $map[$m] ?? ['paid' => false, 'amount_due' => 0, 'amount_paid' => 0, 'prepaid_amount' => 0];
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

                    $computedDue = round($baseDue, 2);
                    $monthDue = ((float) ($monthState['amount_due'] ?? 0)) > 0
                        ? (float) ($monthState['amount_due'] ?? 0)
                        : (float) $computedDue;

                    $monthPaid = (float) ($monthState['amount_paid'] ?? 0);
                    $monthPrepaid = (float) ($monthState['prepaid_amount'] ?? 0);
                    $covered = $monthPaid + $monthPrepaid;

                    if ($monthDue > 0 && $monthDue > $covered) {
                        $unpaidCount++;
                    }

                    $totalDue += (float) $monthDue;
                    // Only include actual paid amounts for revenue recognition. Prepaid amounts will be moved to amount_paid when the month arrives.
                    $totalPaid += (float) $monthPaid;
                    $totalCovered += (float) $covered;
                }

                if ($unpaidCount >= 3) {
                    $flags[$client->id] = true;
                }

                $billingStartStr = !empty($client->billing_start_date) ? (\Carbon\Carbon::parse($client->billing_start_date)->toDateString()) : ($client->contract_start_date ? (\Carbon\Carbon::parse($client->contract_start_date)->toDateString()) : ($client->created_at ? $client->created_at->toDateString() : null));
                $outstandingAmount = round($totalDue - $totalCovered, 2);

                // Update global stats
                $totalDueAllClients += $totalDue;
                $totalPaidAllClients += $totalPaid;
                $totalCoveredAllClients += $totalCovered;
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
        $currentPage = (int) $request->input('page', 1);
        $pagedIds = array_slice($clientIds, ($currentPage - 1) * $perPage, $perPage);

        // Populate aggregates from computed totals
        $aggregates->total_clients = $total;
        $aggregates->total_due = $totalDueAllClients;
        $aggregates->total_paid = $totalPaidAllClients;
        $aggregates->total_covered = $totalCoveredAllClients;
        $aggregates->clients_with_outstanding = $clientsWithOutstanding;

        $overdueClients = collect($overdueClients)
            ->sortByDesc('outstanding_amount')
            ->values()
            ->take(5)
            ->values();

        // Fetch full client models for the page (including sites)
        $pagedClients = collect();
        if (!empty($pagedIds)) {
            $fetched = Client::with(['sites' => function ($q) { $q->select('id','client_id','name','address'); }])->whereIn('id', $pagedIds)->get()->keyBy('id');
            // reorder according to $pagedIds
            foreach ($pagedIds as $id) {
                if (isset($fetched[$id])) $pagedClients->push($fetched[$id]);
            }
        }

        // Replace the paginator items with the computed + ordered page.
        $clients = new LengthAwarePaginator(
            $pagedClients,
            $total,
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        // Build detailed month maps only for clients on this page
        $payments = collect();
        if (!empty($pagedIds)) {
            $pagePayments = ClientPayment::where('year', $year)
                ->whereIn('client_id', $pagedIds)
                ->get(['client_id','month','paid','amount_due','amount_paid','prepaid_amount'])
                ->groupBy('client_id');

            foreach ($pagedIds as $cid) {
                $map = [];
                for ($m = 1; $m <= 12; $m++) {
                    $map[$m] = ['paid' => false, 'amount_due' => 0.0, 'amount_paid' => 0.0, 'prepaid_amount' => 0.0];
                }
                $rows = $pagePayments->get($cid) ?? collect();
                foreach ($rows as $r) {
                    $map[(int)$r->month]['paid'] = (bool)$r->paid;
                    $map[(int)$r->month]['amount_due'] = (float)$r->amount_due;
                    $map[(int)$r->month]['amount_paid'] = (float)$r->amount_paid;
                    $map[(int)$r->month]['prepaid_amount'] = (float)$r->prepaid_amount;
                }
                $payments->put($cid, $map);
            }
        }

        $pageSummaries = [];
        $pageFlags = [];
        foreach ($pagedIds as $id) {
            if (isset($summaries[$id])) {
                $pageSummaries[$id] = $summaries[$id];
            }
            if (!empty($flags[$id])) {
                $pageFlags[$id] = true;
            }
        }

        // Sort overdue clients by outstanding amount and take top 5
        $overallSummary = [
            'total_clients' => (int) ($aggregates->total_clients ?? 0),
            'clients_with_outstanding' => (int) ($aggregates->clients_with_outstanding ?? 0),
            'clients_overdue_percentage' => ($aggregates->total_clients ?? 0) > 0 ?
                round((($aggregates->clients_with_outstanding ?? 0) / max(1, $aggregates->total_clients ?? 0)) * 100, 1) : 0,
            'total_outstanding' => round((float) (($aggregates->total_due ?? 0) - ($aggregates->total_covered ?? 0)), 2),
            'max_outstanding_months' => (int) $maxOutstandingMonths,
            'overdue_clients' => $overdueClients,
            'total_due' => round((float) ($aggregates->total_due ?? 0), 2),
            'total_paid' => round((float) ($aggregates->total_paid ?? 0), 2),
            'collection_rate' => ((float) ($aggregates->total_due ?? 0)) > 0 ?
                round(((float) ($aggregates->total_paid ?? 0) / (float) ($aggregates->total_due ?? 0)) * 100, 1) : 100,
        ];

        // Choose view based on current route namespace (admin vs finance)
        $currentRoute = \Illuminate\Support\Facades\Route::currentRouteName();
        $view = (is_string($currentRoute) && str_starts_with($currentRoute, 'finance.'))
            ? 'Finance/Payments/Index'
            : 'Admin/Payments/Index';

        return Inertia::render($view, [
            'year' => $year,
            'clients' => $clients,
            'payments' => $payments,
            'flags' => $pageFlags,
            'summaries' => $pageSummaries,
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
            'amount' => 'nullable|numeric|min:0',
        ]);

        $client = Client::findOrFail($validated['client_id']);
        $amountDue = $client->getMonthlyDueAmount();
        
        DB::beginTransaction();
        try {
            // Get current payment record
            $payment = ClientPayment::firstOrCreate([
                'client_id' => $validated['client_id'],
                'year' => $validated['year'],
                'month' => $validated['month'],
            ], [
                'paid' => false,
                'amount_due' => $amountDue,
                'amount_paid' => 0,
                'prepaid_amount' => 0,
            ]);

            $now = now();
            $paymentDate = \Carbon\Carbon::createFromDate($validated['year'], $validated['month'], 1);
            $isFutureMonth = $paymentDate->gt($now->endOfMonth());
            
            $newPaid = !$payment->paid;
            
            // If marking as paid
            if ($newPaid) {
                if ($isFutureMonth) {
                    // For future months, set as prepaid
                    // allow partial/prepaid amount override from request
                    $payment->prepaid_amount = $request->input('amount') !== null ? (float)$request->input('amount') : $amountDue;
                    $payment->amount_paid = 0; // Will be counted when the month arrives
                } else {
                    // For current or past months, count as paid.
                    // If there was a prepaid amount recorded earlier for this same row, apply that first.
                    if ($payment->prepaid_amount > 0) {
                        $payment->amount_paid = (float) $payment->amount_paid + (float) $payment->prepaid_amount;
                        $payment->prepaid_amount = 0;
                    } else {
                        $payment->amount_paid = $amountDue;
                        $payment->prepaid_amount = 0;
                    }
                }
            } else {
                // If unmarking, reset both amounts
                $payment->amount_paid = 0;
                $payment->prepaid_amount = 0;
            }
            
            $payment->paid = $newPaid;
            $payment->amount_due = $amountDue;
            $payment->save();

            // Note: prepaid amounts for months that become current without a toggle are handled by the scheduled command

            // Check for delinquency only considering current and past months
            $unpaidCount = ClientPayment::where('client_id', $validated['client_id'])
                ->where(function ($query) use ($validated) {
                    $query->where('year', '<', now()->year)
                        ->orWhere(function ($q) use ($validated) {
                            $q->where('year', now()->year)
                                ->where('month', '<=', now()->month);
                        });
                })
                ->where('paid', false)
                ->count();

            if ($unpaidCount >= 3) {
                Log::warning('Client has 3+ unpaid months', [
                    'client_id' => $validated['client_id'],
                    'year' => $validated['year'],
                    'unpaid_months' => $unpaidCount
                ]);
            }

            DB::commit();
            return back();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}


